import type { NewsItem, NewsSource } from "./types.ts";
import { safeImageUrl, safePublicUrl } from "./sources.ts";
// Named entities seen in Mexican official sites (DOF, Gaceta); unknown names are kept as written.
const ENTITIES:Record<string,string>={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" ",shy:"",
  aacute:"á",eacute:"é",iacute:"í",oacute:"ó",uacute:"ú",Aacute:"Á",Eacute:"É",Iacute:"Í",Oacute:"Ó",Uacute:"Ú",
  ntilde:"ñ",Ntilde:"Ñ",uuml:"ü",Uuml:"Ü",iexcl:"¡",iquest:"¿",laquo:"«",raquo:"»",ordf:"ª",ordm:"º",deg:"°",
  ldquo:"“",rdquo:"”",lsquo:"‘",rsquo:"’",hellip:"…",ndash:"–",mdash:"—",middot:"·",sect:"§",copy:"©",reg:"®"};
export function plainText(value:string, limit=500):string{
  // Entities are decoded twice because some feeds escape them inside CDATA (&amp;oacute;).
  const decode=(s:string)=>s.replace(/&(#x[\da-f]+|#\d+|[a-z]{2,8});/gi,(whole,e:string)=>{
    if(e[0]!=="#")return ENTITIES[e]??ENTITIES[e.toLowerCase()]??whole;
    const n=e[1].toLowerCase()==="x"?parseInt(e.slice(2),16):Number(e.slice(1));return n>0 && n<=0x10ffff && !(n>=0xd800 && n<=0xdfff)?String.fromCodePoint(n):"";
  });
  return decode(decode(value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,"").replace(/<[^>]{0,2000}>/g," "))).replace(/\s+/g," ").trim().slice(0,limit);
}
const tag=(s:string,name:string)=>s.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`,"i"))?.[1]??"";
const tags=(s:string,name:string)=>[...s.matchAll(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`,"gi"))].map(m=>m[1]);
const attr=(s:string,name:string)=>plainText(s.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`,"i"))?.[1]??"",2000);
const MONTHS:Record<string,number>={ene:1,feb:2,mar:3,abr:4,may:5,jun:6,jul:7,ago:8,sep:9,set:9,oct:10,nov:11,dic:12};
/** Parses RFC 822/ISO dates, Spanish RFC-like dates ("sáb., 26 sep. 2026 20:20:04 +0000") and dd/mm/yyyy. */
export function parseNewsDate(value:string):string|null{
  const text=plainText(value,120);if(!text)return null;
  const ms=Date.parse(text);if(Number.isFinite(ms))return new Date(ms).toISOString();
  const dmy=text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const es=text.toLocaleLowerCase("es").match(/(\d{1,2})\s+(?:de\s+)?([a-zá]{3})[a-zá]*\.?\s+(?:de\s+)?(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?\s*(?:([+-])(\d{2}):?(\d{2})|gmt|utc|z)?/);
  let y:number,mo:number,d:number,h=12,mi=0,s=0,offset=0;
  if(dmy){[d,mo,y]=[Number(dmy[1]),Number(dmy[2]),Number(dmy[3])];}
  else if(es&&MONTHS[es[2]]){d=Number(es[1]);mo=MONTHS[es[2]];y=Number(es[3]);if(es[4]){h=Number(es[4]);mi=Number(es[5]);s=Number(es[6]??0);}if(es[7])offset=(es[7]==="-"?-1:1)*(Number(es[8])*60+Number(es[9]));}
  else return null;
  const t=Date.UTC(y,mo-1,d,h,mi,s)-offset*60_000;const check=new Date(Date.UTC(y,mo-1,d));
  return Number.isFinite(t)&&check.getUTCMonth()===mo-1&&check.getUTCDate()===d?new Date(t).toISOString():null;
}
const date=parseNewsDate;
function idFor(source:string,title:string,url:string){let h=2166136261;for(const c of title+url){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return `${source}-${(h>>>0).toString(16)}`;}
function item(source:NewsSource,title:string,url:string,summary=""):NewsItem{
  return {id:idFor(source.id,title,url),title,summary,sourceId:source.id,sourceName:source.name,sourceUrl:url,category:source.category,legalStage:source.id==="dof"?"Publicación DOF":source.id==="facultad"?"Evento":source.id==="dua"?"Aviso académico":"Información",publishedAt:null,eventDate:null};
}
export function parseFeed(xml:string,source:NewsSource):NewsItem[]{
  if(xml.length>2_000_000)throw new Error("Feed demasiado grande.");
  if(/^\s*(?:<!DOCTYPE html|<html\b)/i.test(xml))throw new Error("La fuente devolvió una página web en vez del RSS (posible protección anti-bots). Se reintentará en la próxima lectura.");
  if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw new Error("Se rechazó XML con entidades o DTD.");
  if(!/<(?:rss|feed|rdf:RDF)\b/i.test(xml))throw new Error("La dirección no devolvió un RSS/Atom reconocible.");
  const chunks=[...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].slice(0,80);
  const result:NewsItem[]=[];
  for(const [, ,chunk]of chunks){
    // WordPress appends "The post … appeared first on …" to every teaser; it is not part of the news.
    const html=(tag(chunk,"description")||tag(chunk,"summary")||tag(chunk,"content")||tag(chunk,"media:description")).replace(/(?:<p>)?\s*The post\b[\s\S]*?appeared first on[\s\S]*$/i,"");
    let title=plainText(tag(chunk,"title"),220);let teaser=plainText(html,180);
    // A title without spaces is a file name (SCJN's "SintesisInformativaPDF26noviembre2026"), not a headline.
    if(!/\s/.test(title))continue;
    // DOF's sumario puts the section ("PODER EJECUTIVO SECRETARIA DE ...") in <title> and the act in <description>.
    const description=plainText(html,220);
    if(/[A-ZÁÉÍÓÚÑ]{4}/.test(title)&&title===title.toLocaleUpperCase("es")&&description.length>=20){teaser=title.slice(0,180);title=description;}
    if(title.length<8)continue;
    const atomLinks=[...chunk.matchAll(/<link\b[^>]*\/?\s*>/gi)].map(m=>m[0]);
    const alternate=atomLinks.find(l=>attr(l,"rel")==="alternate")??atomLinks.find(l=>!attr(l,"rel"));
    let rawLink=plainText(tag(chunk,"link"),2000)||attr(alternate??"","href");
    try{rawLink=new URL(rawLink,source.url).href;}catch{continue;}
    const url=safePublicUrl(rawLink);if(!url || !source.hosts.includes(new URL(url).hostname))continue;
    // Feeds carry categories and a teaser, so filters may look beyond the headline.
    const haystack=[title,description,...tags(chunk,"category").map(c=>plainText(c,120))].join(" ").toLocaleLowerCase("es");
    if(source.keywords.length && !source.keywords.some(k=>haystack.includes(k.toLocaleLowerCase("es"))))continue;
    // Only a small teaser, never full syndicated article text or feed HTML.
    const row=item(source,title,url,teaser);
    row.publishedAt=date(tag(chunk,"pubDate")||tag(chunk,"published")||tag(chunk,"dc:date")||tag(chunk,"valueDate"));
    const media=chunk.match(/<(?:media:content|media:thumbnail|enclosure)\b[^>]*>/i)?.[0]??"";
    const img=html.match(/<img\b[^>]*>/i)?.[0]??"";
    row.imageUrl=safeImageUrl(attr(media,"url")||attr(img,"src"),source.url);
    row.imageCredit=row.imageUrl?`Imagen publicada por ${source.name}; consulta créditos en la fuente.`:null;
    // YouTube channel feeds: the video plays in the card (youtube-nocookie) only when the visitor presses play.
    const videoId=plainText(tag(chunk,"yt:videoId"),20);if(/^[\w-]{11}$/.test(videoId))row.youtubeId=videoId;
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
