import type { NewsItem, NewsSource } from "./types.ts";
import { safeImageUrl, safePublicUrl } from "./sources.ts";
export function plainText(value:string, limit=500):string{
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,"").replace(/<[^>]{0,2000}>/g," ").replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(_,e:string)=>{
    const entities:Record<string,string>={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "};
    if(e[0]!=="#")return entities[e.toLowerCase()]??"";
    const n=e[1].toLowerCase()==="x"?parseInt(e.slice(2),16):Number(e.slice(1));return n>0 && n<=0x10ffff && !(n>=0xd800 && n<=0xdfff)?String.fromCodePoint(n):"";
  }).replace(/\s+/g," ").trim().slice(0,limit);
}
const tag=(s:string,name:string)=>s.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`,"i"))?.[1]??"";
const attr=(s:string,name:string)=>plainText(s.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`,"i"))?.[1]??"",2000);
function date(value:string):string|null{const ms=Date.parse(plainText(value));return Number.isFinite(ms)?new Date(ms).toISOString():null;}
function idFor(source:string,title:string,url:string){let h=2166136261;for(const c of title+url){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return `${source}-${(h>>>0).toString(16)}`;}
function item(source:NewsSource,title:string,url:string,summary=""):NewsItem{
  return {id:idFor(source.id,title,url),title,summary,sourceId:source.id,sourceName:source.name,sourceUrl:url,category:source.category,legalStage:source.id==="dof"?"Publicación DOF":source.id==="facultad"?"Evento":source.id==="dua"?"Aviso académico":"Información",publishedAt:null,eventDate:null};
}
export function parseFeed(xml:string,source:NewsSource):NewsItem[]{
  if(xml.length>2_000_000)throw new Error("Feed demasiado grande.");
  if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw new Error("Se rechazó XML con entidades o DTD.");
  if(!/<(?:rss|feed|rdf:RDF)\b/i.test(xml))throw new Error("La dirección no devolvió un RSS/Atom reconocible.");
  const chunks=[...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].slice(0,80);
  const result:NewsItem[]=[];
  for(const [, ,chunk]of chunks){
    const title=plainText(tag(chunk,"title"),220);if(title.length<8)continue;
    const atomLinks=[...chunk.matchAll(/<link\b[^>]*\/?\s*>/gi)].map(m=>m[0]);
    const alternate=atomLinks.find(l=>attr(l,"rel")==="alternate")??atomLinks.find(l=>!attr(l,"rel"));
    let rawLink=plainText(tag(chunk,"link"),2000)||attr(alternate??"","href");
    try{rawLink=new URL(rawLink,source.url).href;}catch{continue;}
    const url=safePublicUrl(rawLink);if(!url || !source.hosts.includes(new URL(url).hostname))continue;
    if(source.keywords.length && !source.keywords.some(k=>title.toLocaleLowerCase("es").includes(k.toLocaleLowerCase("es"))))continue;
    const html=tag(chunk,"description")||tag(chunk,"summary")||tag(chunk,"content");
    // Only a small teaser, never full syndicated article text or feed HTML.
    const teaser=plainText(html,180);const row=item(source,title,url,teaser);
    row.publishedAt=date(tag(chunk,"pubDate")||tag(chunk,"published")||tag(chunk,"dc:date"));
    const media=chunk.match(/<(?:media:content|media:thumbnail|enclosure)\b[^>]*>/i)?.[0]??"";
    const img=html.match(/<img\b[^>]*>/i)?.[0]??"";
    row.imageUrl=safeImageUrl(attr(media,"url")||attr(img,"src"),source.url);
    row.imageCredit=row.imageUrl?`Imagen publicada por ${source.name}; consulta créditos en la fuente.`:null;
    result.push(row);
  }
  return [...new Map(result.map(r=>[r.id,r])).values()].slice(0,30);
}
export function parseOfficialHtml(html:string,source:NewsSource):NewsItem[]{
  if(html.length>2_000_000)throw new Error("Página demasiado grande.");
  const clean=html.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,"");
  const results:NewsItem[]=[];
  // Conservative fallback: only actual headings or meaningful official article links.
  const headings=[...clean.matchAll(/<h([2-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
  for(const m of headings.slice(0,100)){
    const title=plainText(m[2],220);
    if(title.length<18 || (source.keywords.length>0 && !source.keywords.some(k=>title.toLocaleLowerCase("es").includes(k.toLocaleLowerCase("es")))))continue;
    const at=(m.index??0)+m[0].length;const context=clean.slice(at,at+1600).split(/<h[1-6]\b/i)[0];
    const linkTag=(m[2]+context).match(/<a\b[^>]*href=["'][^"']+["'][^>]*>/i)?.[0]??"";
    let url=source.url;try{const candidate=new URL(attr(linkTag,"href"),source.url);if(source.hosts.includes(candidate.hostname))url=candidate.href;}catch{/* use official landing page */}
    if(!safePublicUrl(url))url=source.url;
    const row=item(source,title,url,"");
    // Do not associate a neighbouring photo with this heading: it may belong to the next event.
    // HTML cards use a category graphic; RSS media and editorial attachments have explicit ownership.
    // Only parse explicit machine-readable date, never infer event year from the current year.
    row.publishedAt=date(attr(context.match(/<time\b[^>]*>/i)?.[0]??"","datetime"));
    results.push(row);
  }
  if(!results.length){
    for(const m of [...clean.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi)].slice(0,1500)){
      const title=plainText(m[2],220);if(title.length<30 || (source.keywords.length>0 && !source.keywords.some(k=>title.toLocaleLowerCase("es").includes(k.toLocaleLowerCase("es")))))continue;
      let url:string;try{url=new URL(attr(m[1],"href"),source.url).href;}catch{continue;}
      if(!safePublicUrl(url)||!source.hosts.includes(new URL(url).hostname)||url===source.url)continue;
      results.push(item(source,title,url));if(results.length>=30)break;
    }
  }
  if(!results.length)throw new Error("Sin titulares reconocibles. Revisa el sitio original o publica el aviso manualmente; puede requerir JavaScript.");
  return [...new Map(results.map(r=>[r.id,r])).values()].slice(0,30);
}
