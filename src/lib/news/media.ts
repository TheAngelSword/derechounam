import { safeImageUrl } from "./sources.ts";
import type { NewsItem } from "./types.ts";
export function decodeAttribute(value:string):string{return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi,(_,e:string)=>{const map:Record<string,string>={amp:"&",quot:'"',apos:"'",lt:"<",gt:">",nbsp:" "};if(e[0]!=="#")return map[e.toLowerCase()]??"";const n=e[1].toLowerCase()==="x"?parseInt(e.slice(2),16):Number(e.slice(1));return n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):"";});}
export function attributes(tag:string):Record<string,string>{const result:Record<string,string>={};for(const m of tag.matchAll(/(?:^|\s)([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))result[m[1].toLowerCase()]=decodeAttribute(m[2]??m[3]??m[4]??"");return result;}
export function youtubeId(value:string):string|null{try{const u=new URL(value);if(u.protocol!=="https:"||u.username||u.password||u.port)return null;let id:string|null=null;if(["www.youtube.com","youtube.com","m.youtube.com","www.youtube-nocookie.com","youtube-nocookie.com"].includes(u.hostname))id=u.pathname==="/watch"?u.searchParams.get("v"):u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})(?:\/|$)/)?.[1]??null;else if(u.hostname==="youtu.be")id=u.pathname.slice(1);return id&&/^[\w-]{11}$/.test(id)?id:null;}catch{return null;}}
export function parseArticleMedia(html:string,url:string,sourceName:string):Partial<NewsItem>{
 if(html.length>2_000_000)throw new Error("Artículo demasiado grande.");
 const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]??html.slice(0,120000);const meta:Record<string,string>={};
 for(const m of head.matchAll(/<meta\b[^>]{0,8000}>/gi)){const a=attributes(m[0]);const key=(a.property??a.name??"").toLowerCase();if(key&&a.content&&!meta[key])meta[key]=a.content;}
 const result:Partial<NewsItem>={};const image=safeImageUrl(meta["og:image:secure_url"]||meta["og:image"]||meta["twitter:image"]||"",url);if(image){result.imageUrl=image;result.imageCredit=`Imagen publicada por ${sourceName}. Consulta los créditos en la fuente.`;}
 const video=meta["og:video:secure_url"]||meta["og:video:url"]||meta["og:video"]||"";const yt=youtubeId(video);if(yt)result.youtubeId=yt;else if(/\.(mp4|webm)(?:[?#]|$)/i.test(video))result.videoUrl=safeImageUrl(video,url);
 const body=html.replace(/<(nav|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi,"");const article=body.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]??body;
 if(!result.youtubeId)for(const m of article.matchAll(/<iframe\b[^>]{0,8000}>/gi)){const a=attributes(m[0]);const id=youtubeId(a.src||a["data-src"]||"");if(id){result.youtubeId=id;break;}}
 const date=meta["article:published_time"]||meta["datepublished"];if(date&&/^\d{4}-\d{2}-\d{2}/.test(date)&&Number.isFinite(Date.parse(date)))result.publishedAt=new Date(date).toISOString();
 return result;
}
export function thumbnailFromListing(html:string,articleUrl:string,base:string):string|null{
 for(const m of html.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi)){try{if(new URL(attributes(m[1]).href??"",base).href!==articleUrl)continue;}catch{continue;}const img=m[2].match(/<img\b[^>]*>/i)?.[0];if(!img)continue;const a=attributes(img);const url=safeImageUrl(a["data-src"]||a["data-lazy-src"]||a.src||"",base);if(url)return url;}return null;
}
export function fallbackCategory(category:string){const names:Record<string,string>={Facultad:"facultad","Universidad Abierta":"abierta",Legislación:"legislacion",Justicia:"justicia",Comunidad:"comunidad"};return names[category]??"comunidad";}
export function coverUrl(item:NewsItem){return item.imageUrl||(item.youtubeId&&/^[\w-]{11}$/.test(item.youtubeId)?`https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`:null);}
export function recentItem(item:NewsItem,now:number,days=90){const raw=item.eventDate??item.publishedAt;if(!raw)return false;const d=Date.parse(raw);return Number.isFinite(d)&&d>=now-days*86400000;}
