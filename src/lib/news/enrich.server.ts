import { createHash } from "node:crypto";
import { getSql } from "@/lib/db";
import { assertSourceUrl, DEFAULT_NEWS_SOURCES } from "./sources";
import { parseArticleMedia, thumbnailFromListing, type ArticleMedia } from "./media";
import { NEWS_SNAPSHOT } from "./snapshot";
import type { NewsItem, NewsSource } from "./types";
const MEDIA_PREFIX="article-media-v761:";
const cacheKey=(url:string)=>MEDIA_PREFIX+createHash("sha256").update(url).digest("hex");
const inFlight=new Map<string,Promise<ArticleMedia>>();
const hasMedia=(m:ArticleMedia)=>!!(m.imageUrl||m.youtubeId||m.videoUrl||m.imageCandidates?.length);
async function articleHtml(url:string,source:NewsSource,timeoutMs=5000):Promise<string>{
 let current=assertSourceUrl(url,source.hosts);const signal=AbortSignal.timeout(timeoutMs);
 for(let n=0;n<3;n++){
  const r=await fetch(current,{signal,redirect:"manual",headers:{Accept:"text/html","User-Agent":"FacultadDerechoStudentPortal/7.6.1 (+educational-news-reader)"}});
  if([301,302,303,307,308].includes(r.status)){const next=r.headers.get("location");await r.body?.cancel();if(!next)throw new Error("Redirección sin destino");current=assertSourceUrl(new URL(next,current).href,source.hosts);continue;}
  if(!r.ok||!r.headers.get("content-type")?.toLowerCase().includes("text/html")){await r.body?.cancel();throw new Error("Sin HTML consultable");}
  const reader=r.body?.getReader();if(!reader)throw new Error("Sin contenido");const pieces:Uint8Array[]=[];let length=0;
  try{for(;;){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>2_000_000){await reader.cancel();throw new Error("Límite de lectura");}pieces.push(part.value);}}finally{reader.releaseLock();}
  const latin=/charset\s*=\s*["']?(?:iso-8859-1|windows-1252)/i.test(r.headers.get("content-type")??"");return new TextDecoder(latin?"windows-1252":"utf-8").decode(Buffer.concat(pieces));
 }throw new Error("Demasiadas redirecciones");
}
/** Shared persistent cache, independent of feed order. No new database tables. */
async function cachedArticleMedia(url:string,source:NewsSource,timeoutMs=5000):Promise<ArticleMedia>{
 const key=cacheKey(url);const running=inFlight.get(key);if(running)return running;
 const work=(async()=>{
  const sql=await getSql();
  const [stored]=await sql<{items:ArticleMedia[];checked_at:Date|string|null;last_error:string|null}>`select items,checked_at,last_error from news_cache where source_id=${key}`;
  const previous=stored?.items?.[0]??{};const age=stored?.checked_at?Date.now()-new Date(stored.checked_at).getTime():Infinity;
  const ttl=stored?.last_error?60_000:hasMedia(previous)?24*3600_000:15*60_000;
  if(age<ttl)return previous;
  const locks=await sql`insert into news_refresh_locks(source_id,expires_at) values(${key},now()+interval '15 seconds') on conflict(source_id) do update set expires_at=excluded.expires_at where news_refresh_locks.expires_at<now() returning source_id`;
  if(!locks.length){if(hasMedia(previous))return previous;throw new Error("La miniatura se está preparando. Reintenta en unos segundos.");}
  try{
   const html=await articleHtml(url,source,timeoutMs);const media=parseArticleMedia(html,url,source.name);
   const payload=JSON.stringify([media]);
   await sql`insert into news_cache(source_id,items,fetched_at,checked_at,last_error) values(${key},${payload}::jsonb,now(),now(),null) on conflict(source_id) do update set items=excluded.items,fetched_at=now(),checked_at=now(),last_error=null`;
   return media;
  }catch{
   const payload=JSON.stringify([previous]);
   await sql`insert into news_cache(source_id,items,checked_at,last_error) values(${key},${payload}::jsonb,now(),'No se pudo consultar el recurso original.') on conflict(source_id) do update set checked_at=now(),last_error=excluded.last_error`;
   return previous;
  }finally{await sql`delete from news_refresh_locks where source_id=${key}`;}
 })();inFlight.set(key,work);try{return await work;}finally{inFlight.delete(key);}
}
/** Every entry is eligible. A wall-clock budget protects first paint; visible cards complete pending metadata. */
export async function enrichMedia(items:NewsItem[],source:NewsSource,listing:string):Promise<NewsItem[]>{
 const result=items.map(item=>{const thumb=source.kind==="html"&&item.sourceUrl!==source.url?thumbnailFromListing(listing,item.sourceUrl,source.url):null;return thumb?{...item,imageUrl:item.imageUrl||thumb,imageCredit:item.imageCredit||`Imagen publicada por ${source.name}. Consulta los créditos en la fuente.`}:{...item};});
 const deadline=Date.now()+8000;let cursor=0;
 await Promise.all(Array.from({length:3},async()=>{while(cursor<result.length&&Date.now()<deadline-250){const i=cursor++;const item=result[i];if(item.sourceUrl===source.url||/\.(pdf|docx?|zip|png|jpe?g|webp)(?:[?#]|$)/i.test(item.sourceUrl))continue;try{const media=await cachedArticleMedia(item.sourceUrl,source,Math.max(250,Math.min(5000,deadline-Date.now())));result[i]={...item,...media};}catch{/* The visible-card resolver retries without hiding the headline. */}}}));
 return result;
}
/** Public resolver accepts only articles already included in a source cache or reviewed snapshot. */
export async function readKnownArticleMedia(rawUrl:string):Promise<ArticleMedia>{
 const requested=new URL(rawUrl);const source=DEFAULT_NEWS_SOURCES.find(s=>s.hosts.includes(requested.hostname));
 if(!source)throw new Error("Fuente no admitida.");
 const url=assertSourceUrl(rawUrl,source.hosts);
 if(/\.(?:pdf|docx?|zip|png|jpe?g|webp)(?:[?#]|$)/i.test(url))return {};
 const sql=await getSql();
 const needle=JSON.stringify([{sourceUrl:url}]);
 const [known]=await sql`select source_id from news_cache where source_id not like 'article-media-%' and items @> ${needle}::jsonb limit 1`;
 if(!known&&!NEWS_SNAPSHOT.some(item=>item.sourceUrl===url))throw new Error("La publicación no está incluida en el lector.");
 return cachedArticleMedia(url,source);
}
