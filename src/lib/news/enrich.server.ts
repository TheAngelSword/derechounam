import { assertSourceUrl } from "./sources";
import { parseArticleMedia,thumbnailFromListing } from "./media";
import type { NewsItem,NewsSource } from "./types";
async function articleHtml(url:string,source:NewsSource):Promise<string>{
 let current=assertSourceUrl(url,source.hosts);const signal=AbortSignal.timeout(5000);
 for(let n=0;n<3;n++){
  const r=await fetch(current,{signal,redirect:"manual",headers:{Accept:"text/html","User-Agent":"FacultadDerechoStudentPortal/7.1"}});
  if([301,302,303,307,308].includes(r.status)){const next=r.headers.get("location");await r.body?.cancel();if(!next)throw new Error("Redirección sin destino");current=assertSourceUrl(new URL(next,current).href,source.hosts);continue;}
  if(!r.ok||!r.headers.get("content-type")?.toLowerCase().includes("text/html")){await r.body?.cancel();throw new Error("Sin HTML consultable");}
  const reader=r.body?.getReader();if(!reader)throw new Error("Sin contenido");const pieces:Uint8Array[]=[];let length=0;
  try{for(;;){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>2_000_000){await reader.cancel();throw new Error("Límite de lectura");}pieces.push(part.value);}}finally{reader.releaseLock();}
  const latin=/charset\s*=\s*["']?(?:iso-8859-1|windows-1252)/i.test(r.headers.get("content-type")??"");return new TextDecoder(latin?"windows-1252":"utf-8").decode(Buffer.concat(pieces));
 }throw new Error("Demasiadas redirecciones");
}
/** Runs only when the existing source cache expires or a moderator explicitly refreshes it. */
export async function enrichMedia(items:NewsItem[],source:NewsSource,listing:string):Promise<NewsItem[]>{
 const result=items.map(item=>{const thumb=source.kind==="html"&&item.sourceUrl!==source.url?thumbnailFromListing(listing,item.sourceUrl,source.url):null;return thumb?{...item,imageUrl:thumb,imageCredit:`Imagen publicada por ${source.name}. Consulta los créditos en la fuente.`}:{...item};});
 let cursor=0;await Promise.all(Array.from({length:3},async()=>{while(cursor<Math.min(result.length,6)){const i=cursor++;const item=result[i];if(item.sourceUrl===source.url||/\.(pdf|docx?|zip|png|jpe?g)(?:[?#]|$)/i.test(item.sourceUrl))continue;try{const html=await articleHtml(item.sourceUrl,source);result[i]={...item,...parseArticleMedia(html,item.sourceUrl,source.name)};}catch{/* Missing media never removes the headline. */}}}));return result;
}
