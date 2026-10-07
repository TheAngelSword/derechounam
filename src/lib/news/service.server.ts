import { getSql } from "@/lib/db";
import { DEFAULT_NEWS_SETTINGS, mergeSettings, assertSourceUrl } from "./sources";
import { parseFeed, parseOfficialHtml } from "./parser";
import { NEWS_SNAPSHOT } from "./snapshot";
import type {NewsFeed,NewsItem,NewsSettings,NewsSource,NewsSourceStatus} from "./types";
type Cache={items:NewsItem[];fetched_at:Date|string|null;checked_at:Date|string|null;last_error:string|null};
const iso=(v:Date|string|null|undefined)=>v?new Date(v).toISOString():null;
export async function readNewsSettings():Promise<NewsSettings>{
 const sql=await getSql();const [row]=await sql<{setting_value:string}>`select setting_value from app_settings where setting_key='news_settings_v7'`;
 return row?mergeSettings(JSON.parse(row.setting_value)):DEFAULT_NEWS_SETTINGS;
}
export async function fetchOfficialSource(source:NewsSource):Promise<NewsItem[]>{
 let url=assertSourceUrl(source.url,source.hosts);const signal=AbortSignal.timeout(9000);
 for(let redirect=0;redirect<4;redirect++){
   const response=await fetch(url,{redirect:"manual",signal,headers:{Accept:source.kind==="rss"?"application/rss+xml, application/atom+xml, application/xml, text/xml":"text/html","User-Agent":"FacultaDerechoStudentPortal/7.0 (+educational-news-reader)"}});
   if([301,302,303,307,308].includes(response.status)){
     const location=response.headers.get("location");await response.body?.cancel();if(!location)throw new Error("Redirección sin destino.");url=assertSourceUrl(new URL(location,url).href,source.hosts);continue;
   }
   if(!response.ok){await response.body?.cancel();throw new Error(`La fuente respondió HTTP ${response.status}.`);}
   const reader=response.body?.getReader();if(!reader)throw new Error("Fuente sin contenido.");
   const chunks:Uint8Array[]=[];let size=0;
   try{for(;;){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>2_000_000){await reader.cancel();throw new Error("La fuente excede el límite de lectura.");}chunks.push(r.value);}}finally{reader.releaseLock();}
   const bytes=Buffer.concat(chunks);let text=bytes.toString("utf8");
   if(/charset\s*=\s*["']?(?:iso-8859-1|windows-1252)/i.test(response.headers.get("content-type")??""))text=new TextDecoder("windows-1252").decode(bytes);
   const items=source.kind==="rss"?parseFeed(text,source):parseOfficialHtml(text,source);
   if(!items.length)throw new Error("La fuente respondió, pero no se encontraron entradas que coincidan con los filtros.");
   return items;
 }
 throw new Error("Demasiadas redirecciones en la fuente.");
}
async function refreshSource(source:NewsSource,settings:NewsSettings,force:boolean):Promise<{items:NewsItem[];status:NewsSourceStatus}>{
 const sql=await getSql();let [cache]=await sql<Cache>`select items,fetched_at,checked_at,last_error from news_cache where source_id=${source.id}`;
 const stale=!cache?.checked_at || Date.now()-new Date(cache.checked_at).getTime()>settings.intervalMinutes*60_000;
 if(source.enabled && (stale||force)){
  const locks=await sql`insert into news_refresh_locks(source_id,expires_at) values(${source.id},now()+interval '45 seconds') on conflict(source_id) do update set expires_at=excluded.expires_at where news_refresh_locks.expires_at<now() returning source_id`;
  if(locks.length){
   try{
    const items=await fetchOfficialSource(source);const json=JSON.stringify(items);
    await sql`insert into news_cache(source_id,items,fetched_at,checked_at,last_error) values(${source.id},${json}::jsonb,now(),now(),null) on conflict(source_id) do update set items=excluded.items,fetched_at=now(),checked_at=now(),last_error=null`;
    cache={items,fetched_at:new Date(),checked_at:new Date(),last_error:null};
   }catch(error){
    const message=error instanceof Error?error.message.slice(0,220):"No se pudo leer la fuente.";
    await sql`insert into news_cache(source_id,items,checked_at,last_error) values(${source.id},'[]'::jsonb,now(),${message}) on conflict(source_id) do update set checked_at=now(),last_error=excluded.last_error`;
    cache={items:cache?.items??[],fetched_at:cache?.fetched_at??null,checked_at:new Date(),last_error:message};
   }finally{await sql`delete from news_refresh_locks where source_id=${source.id}`;}
  }
 }
 const items=source.enabled?(cache?.items?.length?cache.items:NEWS_SNAPSHOT.filter(i=>i.sourceId===source.id)):[];
 return {items,status:{id:source.id,name:source.name,enabled:source.enabled,checkedAt:iso(cache?.checked_at),fetchedAt:iso(cache?.fetched_at),error:cache?.last_error??null,count:items.filter(i=>!i.snapshot).length,kind:source.kind}};
}
export async function readEditorial(includeHidden=false):Promise<NewsItem[]>{
 const sql=await getSql();const rows=await sql.query<Record<string,unknown>>(`select * from news_posts ${includeHidden?"":"where published=true"} order by pinned desc,published_at desc nulls last,created_at desc limit 100`);
 return rows.map(r=>({id:`editorial-${r.id}`,title:String(r.title),summary:String(r.summary),sourceId:"editorial",sourceName:String(r.source_name),sourceUrl:String(r.source_url),category:String(r.category),legalStage:String(r.legal_stage),publishedAt:iso(r.published_at as Date|null),eventDate:r.event_date?new Date(r.event_date as string).toISOString().slice(0,10):null,imageUrl:r.image_upload_id?`/api/drive-file?id=${r.image_upload_id}`:null,videoUrl:r.video_upload_id?`/api/drive-file?id=${r.video_upload_id}`:null,youtubeId:r.youtube_id?String(r.youtube_id):null,pinned:!!r.pinned,published:!!r.published}));
}
export async function getNewsFeed(force=false):Promise<NewsFeed>{
 try{
  const settings=await readNewsSettings();const [results,manual]=await Promise.all([Promise.all(settings.sources.map(s=>refreshSource(s,settings,force))),readEditorial()]);
  const items=[...manual,...results.flatMap(r=>r.items)];
  const dedup=[...new Map(items.map(i=>[`${i.title.toLocaleLowerCase("es")}::${i.sourceUrl}`,i])).values()];
  dedup.sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||Number(!!a.snapshot)-Number(!!b.snapshot)||(b.publishedAt??b.eventDate??"").localeCompare(a.publishedAt??a.eventDate??""));
  return {items:dedup.slice(0,120),sources:results.map(r=>r.status),generatedAt:new Date().toISOString()};
 }catch{return {items:NEWS_SNAPSHOT,sources:[],error:"No se pudo consultar el servicio de noticias. Se muestran referencias revisadas el 6 de octubre de 2026, no una actualización en directo.",generatedAt:new Date().toISOString()};}
}
