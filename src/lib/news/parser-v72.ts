import { parseOfficialHtml,plainText } from "./parser.ts";
import { attributes } from "./media.ts";
import { safeImageUrl,safePublicUrl } from "./sources.ts";
import type {NewsSource,NewsItem} from "./types.ts";
const key=(source:string,url:string)=>{let n=2166136261;for(const c of url)n=Math.imul(n^c.charCodeAt(0),16777619);return `${source}-link-${(n>>>0).toString(16)}`;};
/** Preserve valid heading results, and also inspect meaningful article links and linked posters. */
export function parseOfficialHtmlV72(html:string,source:NewsSource):NewsItem[]{
 if(html.length>2_000_000)throw new Error("Página demasiado grande.");
 let existing:NewsItem[]=[];try{existing=parseOfficialHtml(html,source);}catch{/* A linked poster may have an alt/title instead of heading text. */}
 const clean=html.replace(/<(script|style|nav|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,"");
 const additions:NewsItem[]=[];
 for(const m of [...clean.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi)].slice(0,1800)){
  const a=attributes(m[1]),img=attributes(m[2].match(/<img\b[^>]*>/i)?.[0]??"");
  const title=plainText(a.title||m[2].replace(/<img\b[^>]*>/gi,"")||img.alt||"",220)||plainText(img.alt??"",220);
  if(title.length<22||/^(?:ver más|leer más|inicio|contacto|aviso de privacidad|derechos reservados|iniciar sesión|calendario escolar)$/i.test(title))continue;
  if(source.keywords.length&&!source.keywords.some(k=>title.toLocaleLowerCase("es").includes(k.toLocaleLowerCase("es"))))continue;
  let url:URL;try{url=new URL(a.href??"",source.url);}catch{continue;}
  if(!a.href||a.href.startsWith("#")||!safePublicUrl(url.href)||!source.hosts.includes(url.hostname)||url.href===source.url)continue;
  if(/\/(?:tag|category|author|wp-json|wp-admin|login|page|search)(?:\/|$)/i.test(url.pathname)||url.searchParams.has("s"))continue;
  if(source.id==="buho"&&!url.pathname.includes("/article/view/"))continue;
  if(source.id.startsWith("gaceta")&&(/\.(?:png|jpe?g|gif|pdf)$/i.test(url.pathname)||/^\/g\d+\/?$/.test(url.pathname)))continue;
  const picture=safeImageUrl(img["data-src"]||img["data-lazy-src"]||img.src||"",source.url);
  const row:NewsItem={id:key(source.id,url.href),title,summary:"",sourceId:source.id,sourceName:source.name,sourceUrl:url.href,category:source.category,legalStage:source.id==="dof"?"Publicación DOF":source.id==="facultad"?"Evento":source.id==="dua"?"Aviso académico":"Información",publishedAt:null,eventDate:null,imageUrl:picture,imageCredit:picture?`Imagen publicada por ${source.name}. Consulta créditos en la fuente.`:null};
  if(source.id==="dof"){const d=url.searchParams.get("fecha")?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(d){const iso=`${d[3]}-${d[2]}-${d[1]}`;const t=new Date(`${iso}T12:00:00Z`);if(Number.isFinite(t.getTime())&&t.toISOString().startsWith(iso))row.publishedAt=t.toISOString();}}
  additions.push(row);
 }
 const result=new Map<string,NewsItem>();
 for(const row of [...existing,...additions]){const parsed=new URL(row.sourceUrl);if(row.sourceUrl!==source.url&&(/\/(?:tag|category|author|wp-json|wp-admin|login|page|search)(?:\/|$)/i.test(parsed.pathname)||parsed.searchParams.has("s")))continue;if(source.id==="buho"&&!new URL(row.sourceUrl).pathname.includes("/article/view/"))continue;const id=row.sourceUrl===source.url?`${row.sourceUrl}#${row.title}`:row.sourceUrl;const previous=result.get(id);result.set(id,previous?{...previous,imageUrl:previous.imageUrl||row.imageUrl,imageCredit:previous.imageCredit||row.imageCredit}:row);}
 if(!result.size)throw new Error("No se pudieron reconocer publicaciones. Consulta la fuente original; puede requerir JavaScript.");
 return [...result.values()].slice(0,40);
}
