import { safeImageUrl } from "./sources.ts";
import type { NewsItem } from "./types.ts";
export type ArticleMedia = Partial<NewsItem> & { imageCandidates?: string[] };
export function decodeAttribute(value:string):string{return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi,(_,e:string)=>{const map:Record<string,string>={amp:"&",quot:'"',apos:"'",lt:"<",gt:">",nbsp:" "};if(e[0]!=="#")return map[e.toLowerCase()]??"";const n=e[1].toLowerCase()==="x"?parseInt(e.slice(2),16):Number(e.slice(1));return n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):"";});}
export function attributes(tag:string):Record<string,string>{const result:Record<string,string>={};for(const m of tag.matchAll(/(?:^|\s)([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))result[m[1].toLowerCase()]=decodeAttribute(m[2]??m[3]??m[4]??"");return result;}
export function youtubeId(value:string):string|null{try{const u=new URL(value);if(u.protocol!=="https:"||u.username||u.password||u.port)return null;let id:string|null=null;if(["www.youtube.com","youtube.com","m.youtube.com","www.youtube-nocookie.com","youtube-nocookie.com"].includes(u.hostname))id=u.pathname==="/watch"?u.searchParams.get("v"):u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})(?:\/|$)/)?.[1]??null;else if(u.hostname==="youtu.be")id=u.pathname.match(/^\/([\w-]{11})(?:\/|$)/)?.[1]??null;return id&&/^[\w-]{11}$/.test(id)?id:null;}catch{return null;}}
/** A legacy HTTP photo is upgraded ONLY on an already permitted official host. */
function articleImage(value:string,base:string):string|null{
 if(!value.trim())return null;
 try{const u=new URL(decodeAttribute(value).trim(),base);if(u.protocol==="http:")u.protocol="https:";const safe=safeImageUrl(u.href,base);if(!safe)return null;
  if(/(?:^|[\/_-])(?:logo|avatar|placeholder|spacer|tracking|pixel|blank)(?:[\/_\-.]|$)/i.test(u.pathname)||/\.gif$/i.test(u.pathname))return null;
  return safe;
 }catch{return null;}
}
function srcsetUrls(value:string):string[]{return value.split(",").map(part=>{const [url,descriptor]=part.trim().split(/\s+/);const weight=parseFloat(descriptor||"1");return{url,weight:Number.isFinite(weight)?weight:1};}).filter(p=>p.url).sort((a,b)=>b.weight-a.weight).map(p=>p.url);}
/** Lazy images, srcset, and background-image cards; never search a neighbouring story. */
function imagesIn(fragment:string,base:string):string[]{
 const found:string[]=[];const add=(value:string)=>{const u=articleImage(value,base);if(u&&!found.includes(u))found.push(u);};
 for(const match of fragment.matchAll(/<(?:img|source|a|div|span|figure)\b[^>]{0,12000}>/gi)){
  const a=attributes(match[0]);
  if(/(?:avatar|logo|advert|social-icon)/i.test(a.class??""))continue;
  const w=Number(a.width),h=Number(a.height);if((w>0&&w<160)||(h>0&&h<90))continue;
  for(const key of ["data-srcset","data-lazy-srcset","srcset"])for(const u of srcsetUrls(a[key]??""))add(u);
  for(const key of ["data-src","data-lazy-src","data-original","data-lazy","data-bg","data-background","data-bg-src","src"])if(a[key])add(a[key]);
  for(const m of (a.style??"").matchAll(/(?:background(?:-image)?\s*:[^;]*?)url\(\s*["']?([^"')]+)["']?\s*\)/gi))add(m[1]);
 }
 return found.slice(0,8);
}
function canonical(value:string,base:string):string|null{try{const u=new URL(value,base);u.hash="";return u.href.replace(/\/$/,"");}catch{return null;}}
export function thumbnailFromListing(html:string,articleUrl:string,base:string):string|null{
 const target=canonical(articleUrl,base);
 for(const m of html.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi)){
  const a=attributes(m[1]);if(!a.href||canonical(a.href,base)!==target)continue;
  const found=imagesIn(m[0],base);if(found.length)return found[0];
 }
 return null;
}
export function parseArticleMedia(html:string,url:string,sourceName:string):ArticleMedia{
 if(html.length>2_000_000)throw new Error("Artículo demasiado grande.");
 const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]??html.slice(0,120000);const meta:Record<string,string>={};
 for(const m of head.matchAll(/<meta\b[^>]{0,8000}>/gi)){const a=attributes(m[0]);const key=(a.property??a.name??"").toLowerCase();if(key&&a.content&&!meta[key])meta[key]=a.content;}
 const result:ArticleMedia={};const images:string[]=[];const add=(raw:unknown)=>{if(typeof raw!=="string")return;const value=articleImage(raw,url);if(value&&!images.includes(value))images.push(value);};
 for(const key of ["og:image:secure_url","og:image","og:image:url","twitter:image","twitter:image:src"])add(meta[key]);
 const explicitImage=images[0];
 const video=meta["og:video:secure_url"]||meta["og:video:url"]||meta["og:video"]||"";const yt=youtubeId(video);if(yt)result.youtubeId=yt;else if(/\.(mp4|webm)(?:[?#]|$)/i.test(video))result.videoUrl=safeImageUrl(video,url);
 // Restrict body fallback to article content, never menus, sidebars or related stories.
 const clean=html.replace(/<(nav|footer|header|aside)\b[^>]*>[\s\S]*?<\/\1>/gi,"");
 let article=clean.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]??"";
 if(!article){const start=clean.search(/<(?:div|section)\b[^>]*(?:class|id)=["'][^"']*\b(?:entry-content|post-content|article-content)\b/i);if(start>=0)article=clean.slice(start);}
 article=article.split(/<(?:div|section)\b[^>]*(?:class|id)=["'][^"']*\b(?:related-posts|related-articles|post-related|comments-area|sidebar)\b/i)[0];
 const body=article.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,"");
 for(const m of body.matchAll(/<(?:iframe|a|div|lite-youtube)\b[^>]{0,8000}>/gi)){
  if(result.youtubeId)break;const a=attributes(m[0]);
  for(const candidate of [a.src,a["data-src"],a["data-lazy-src"],a.href,a["data-embed-url"]]){if(!candidate)continue;try{const id=youtubeId(new URL(candidate,url).href);if(id){result.youtubeId=id;break;}}catch{}}
  const id=a.videoid||a["data-videoid"];if(!result.youtubeId&&id&&/^[\w-]{11}$/.test(id)&&/^<lite-youtube\b/i.test(m[0]))result.youtubeId=id;
 }
 // Article-scoped structured data; do not use Organization logos or related graphs as covers.
 let nodes=0;
 const visit=(value:unknown,depth=0)=>{if(depth>8||++nodes>500||!value||typeof value!=="object")return;if(Array.isArray(value)){for(const x of value)visit(x,depth+1);return;}const obj=value as Record<string,unknown>;const types=Array.isArray(obj["@type"])?obj["@type"]:[obj["@type"]];
  if(types.some(t=>typeof t==="string"&&/^(?:NewsArticle|Article|BlogPosting|VideoObject)$/.test(t))){
   const identity=typeof obj.url==="string"?obj.url:typeof obj.mainEntityOfPage==="string"?obj.mainEntityOfPage:null;
   if(!identity||canonical(identity,url)===canonical(url,url)){
    const extract=(v:unknown)=>{if(typeof v==="string")add(v);else if(v&&typeof v==="object"&&!Array.isArray(v)){const o=v as Record<string,unknown>;add(o.url);add(o.contentUrl);}};
    for(const v of [obj.image,obj.thumbnailUrl]){if(Array.isArray(v))v.forEach(extract);else extract(v);}
    if(!result.youtubeId)for(const v of [obj.embedUrl,obj.contentUrl])if(typeof v==="string"){const id=youtubeId(v);if(id){result.youtubeId=id;break;}}
    if(!result.publishedAt&&typeof obj.datePublished==="string"&&/^\d{4}-\d{2}-\d{2}/.test(obj.datePublished)&&Number.isFinite(Date.parse(obj.datePublished)))result.publishedAt=new Date(obj.datePublished).toISOString();
   }
  }
  if(obj["@graph"])visit(obj["@graph"],depth+1);if(obj.mainEntity)visit(obj.mainEntity,depth+1);
 };
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(attributes(m[1]).type?.toLowerCase()!=="application/ld+json"||m[2].length>300000)continue;try{visit(JSON.parse(m[2]));}catch{/* Malformed metadata must not hide the article. */}}
 for(const candidate of imagesIn(body,url))add(candidate);
 if(images.length){result.imageCandidates=images.slice(0,6);if(explicitImage||!result.youtubeId)result.imageUrl=explicitImage||images[0];result.imageCredit=`Imagen publicada por ${sourceName}. Consulta los créditos en la fuente.`;}
 const date=meta["article:published_time"]||meta["datepublished"];if(date&&/^\d{4}-\d{2}-\d{2}/.test(date)&&Number.isFinite(Date.parse(date)))result.publishedAt=new Date(date).toISOString();
 return result;
}
export function fallbackCategory(category:string){const names:Record<string,string>={Facultad:"facultad","Universidad Abierta":"abierta",Legislación:"legislacion",Justicia:"justicia",Comunidad:"comunidad"};return names[category]??"comunidad";}
export function coverUrl(item:NewsItem){return item.imageUrl||(item.youtubeId&&/^[\w-]{11}$/.test(item.youtubeId)?`https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`:null);}
export function coverCandidates(item:NewsItem):string[]{const media=item as ArticleMedia;return [...new Set([coverUrl(item),...(item.youtubeId&&/^[\w-]{11}$/.test(item.youtubeId)?[`https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`]:[]),...(media.imageCandidates??[])].filter((v):v is string=>!!v))].slice(0,8);}
export function recentItem(item:NewsItem,now:number,days=90){const raw=item.eventDate??item.publishedAt;if(!raw)return false;const d=Date.parse(raw);return Number.isFinite(d)&&d>=now-days*86400000;}
