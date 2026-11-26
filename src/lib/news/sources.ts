import { NEWS_CATEGORIES, type NewsChannel, type NewsSource, type NewsSettings } from "./types.ts";
export const DEFAULT_NEWS_SOURCES: NewsSource[] = [
 {id:"gaceta-actualidad",name:"Gaceta UNAM · Actualidad jurídica",url:"https://www.gaceta.unam.mx/?s=jur%C3%ADdic&feed=rss2",homepage:"https://www.gaceta.unam.mx/",hosts:["www.gaceta.unam.mx","gaceta.unam.mx"],category:"Comunidad",kind:"rss",enabled:true,note:"RSS oficial de búsqueda de Gaceta UNAM (notas sobre temas jurídicos, ordenadas por fecha). Se filtra por palabras del título, resumen y categorías; se conservan las fechas originales.",keywords:["derecho","justicia","jurídic","constituc","suayed","reforma","tribunal","abierta","electoral","democracia","ley general"]},
 {id:"buho",name:"El Búho · Gaceta de Derecho",url:"https://revistas.unam.mx/index.php/derecho/gateway/plugin/WebFeedGatewayPlugin/rss2",homepage:"https://revistas.unam.mx/index.php/derecho",hosts:["revistas.unam.mx","www.revistas.unam.mx"],category:"Facultad",kind:"rss",enabled:true,note:"RSS oficial de la revista (OJS). Ensayos y cultura jurídica, no noticias de última hora ni resoluciones judiciales. El sitio usa protección anti-bots: si bloquea la lectura, se informa el fallo.",keywords:[]},
 {id:"dua",name:"Universidad Abierta · DUA",url:"https://duaderecho.unam.mx/",homepage:"https://duaderecho.unam.mx/",hosts:["duaderecho.unam.mx"],category:"Universidad Abierta",kind:"html",enabled:true,note:"Sitio oficial de modalidad abierta. Adaptador HTML: si el contenido depende de JavaScript, se informa el fallo y se conserva la última lectura; no se presupone un RSS.",keywords:["sua","convocatoria","aviso","inscripción","examen","programa","calendario","evento","derecho","seminario"]},
 {id:"facultad",name:"Facultad de Derecho · Agenda",url:"https://www.derecho.unam.mx/eventos/",homepage:"https://www.derecho.unam.mx/eventos/",hosts:["www.derecho.unam.mx","derecho.unam.mx"],category:"Facultad",kind:"html",enabled:true,note:"Agenda institucional. La fecha del evento no se presenta como fecha de publicación. Confirma cambios y año en el cartel original.",keywords:["derecho","libro","conferencia","taller","curso","seminario","jornada","congreso","presentación"]},
 {id:"gaceta",name:"Gaceta UNAM · Derecho",url:"https://www.gaceta.unam.mx/tag/facultad-de-derecho/feed/",homepage:"https://www.gaceta.unam.mx/tag/facultad-de-derecho/",hosts:["www.gaceta.unam.mx","gaceta.unam.mx"],category:"Facultad",kind:"rss",enabled:true,note:"RSS oficial de la etiqueta Facultad de Derecho en Gaceta UNAM, con fecha de publicación. Gaceta etiqueta pocas notas; las de más de un año no se muestran.",keywords:[]},
 {id:"dof",name:"Diario Oficial de la Federación",url:"https://dof.gob.mx/sumario.xml",homepage:"https://dof.gob.mx/website/filtroRss.php",hosts:["dof.gob.mx","www.dof.gob.mx"],category:"Legislación",kind:"rss",enabled:true,note:"Sumario RSS oficial del día, filtrado por decretos, reformas, leyes y reglamentos. La publicación no implica entrada en vigor inmediata: consulta transitorios.",keywords:["decreto","reforma","adiciona","deroga","ley","constitución","código","reglamento","acuerdo general","sentencia","norma oficial","lineamientos"]},
 {id:"scjn",name:"Suprema Corte · Noticias",url:"https://www.scjn.gob.mx/rss.xml",homepage:"https://www.scjn.gob.mx/multimedia/comunicados",hosts:["www.scjn.gob.mx","scjn.gob.mx"],category:"Justicia",kind:"rss",enabled:true,note:"RSS oficial de la Suprema Corte: sesiones, comunicados y galerías. Las síntesis informativas en PDF se omiten. Un comunicado no equivale por sí solo a jurisprudencia.",keywords:[]},
 {id:"yt-scjn",name:"Suprema Corte · Videos",url:"https://www.youtube.com/feeds/videos.xml?channel_id=UCV0EOz5EywI75hynyg6_Rew",homepage:"https://www.youtube.com/channel/UCV0EOz5EywI75hynyg6_Rew",hosts:["www.youtube.com"],category:"Justicia",kind:"rss",enabled:true,note:"Canal oficial de YouTube de la SCJN: sesiones del Pleno, tarjetas informativas y explicaciones. Se reproduce sólo al pulsar.",keywords:[]},
 {id:"yt-iij",name:"Instituto de Investigaciones Jurídicas UNAM · Videos",url:"https://www.youtube.com/feeds/videos.xml?channel_id=UCnsAwaunoXOv-OUEABUbUmQ",homepage:"https://www.youtube.com/channel/UCnsAwaunoXOv-OUEABUbUmQ",hosts:["www.youtube.com"],category:"Facultad",kind:"rss",enabled:true,note:"Canal oficial del IIJ-UNAM: congresos, conferencias y seminarios de derecho.",keywords:[]},
 {id:"yt-tepjf",name:"Tribunal Electoral · Videos",url:"https://www.youtube.com/feeds/videos.xml?channel_id=UCl9hkmRp-X3w8F_XQXOvu9w",homepage:"https://www.youtube.com/channel/UCl9hkmRp-X3w8F_XQXOvu9w",hosts:["www.youtube.com"],category:"Justicia",kind:"rss",enabled:true,note:"Canal oficial del TEPJF: sentencias y explicaciones de derecho electoral.",keywords:[]},
 {id:"yt-senado",name:"Senado de la República · Videos",url:"https://www.youtube.com/feeds/videos.xml?channel_id=UCoeJxDc717MNVJtUsQW20Qg",homepage:"https://www.youtube.com/channel/UCoeJxDc717MNVJtUsQW20Qg",hosts:["www.youtube.com"],category:"Legislación",kind:"rss",enabled:true,note:"Canal oficial del Senado. Se muestran sólo los videos sobre reformas, leyes, dictámenes e iniciativas.",keywords:["reforma","ley","dictamen","iniciativa","constitu","código","estudios legislativos","justicia"]},
 {id:"diputados",name:"Cámara de Diputados · Reformas",url:"https://www.diputados.gob.mx/LeyesBiblio/ref/index.htm",homepage:"https://www.diputados.gob.mx/LeyesBiblio/ref/index.htm",hosts:["www.diputados.gob.mx","diputados.gob.mx"],category:"Legislación",kind:"html",enabled:false,note:"Índice de referencia de reformas. No se ha confirmado un RSS. Requiere probar el adaptador antes de habilitarlo.",keywords:["ley","código","decreto","reforma","constitución"]},
 {id:"pj-coahuila",name:"Poder Judicial de Coahuila",url:"https://www.pjecz.gob.mx/feeds/comunicados.rss.xml",homepage:"https://www.pjecz.gob.mx/consultas/fuentes-rss/",hosts:["www.pjecz.gob.mx","pjecz.gob.mx"],category:"Justicia",kind:"rss",enabled:false,note:"RSS documentado en la página oficial; la respuesta del feed debe probarse en el servidor. Jurisdicción estatal: Coahuila, no legislación federal ni información de la UNAM.",keywords:[]},
];
/** URLs that earlier versions shipped as defaults; saved settings that still use them move to the current default. */
const PREVIOUS_DEFAULT_URLS:Record<string,string[]>={"gaceta-actualidad":["https://www.gaceta.unam.mx/"],buho:["https://revistas.unam.mx/index.php/derecho"],gaceta:["https://www.gaceta.unam.mx/tag/facultad-de-derecho/"],dof:["https://dof.gob.mx/index.php"],scjn:["https://www.internet2.scjn.gob.mx/red2/comunicados/"]};
/** Sources that were off by default only because no working feed existed; upgrading them also turns them on. */
const ENABLE_ON_UPGRADE=new Set(["scjn"]);
/** Automatic entries older than this many days are hidden (Control can change it). */
export const DEFAULT_MAX_AGE_DAYS=30;
export const DEFAULT_NEWS_SETTINGS: NewsSettings = {intervalMinutes:60,maxAgeDays:DEFAULT_MAX_AGE_DAYS,sources:DEFAULT_NEWS_SOURCES,channels:[]};
export const YOUTUBE_CHANNEL_ID=/^UC[\w-]{22}$/;
/** Builds the reader source for a YouTube channel added from Control. */
export function channelSource(c:NewsChannel):NewsSource{
 return {id:`yt-${c.channelId}`,name:c.name,url:`https://www.youtube.com/feeds/videos.xml?channel_id=${c.channelId}`,homepage:`https://www.youtube.com/channel/${c.channelId}`,hosts:["www.youtube.com"],category:c.category,kind:"rss",enabled:c.enabled,note:"Canal de YouTube agregado desde Control.",keywords:[]};
}
export function assertSourceUrl(value: string, hosts: string[]): string {
 const url = new URL(value);
 if(url.protocol!=="https:" || url.username || url.password || url.port || !hosts.includes(url.hostname.toLowerCase())) throw new Error("Sólo se permiten direcciones HTTPS de la fuente oficial seleccionada.");
 if(url.pathname.endsWith("filtroRss.php")) throw new Error("Pega el enlace RSS generado por el filtro, no la página del configurador.");
 return url.href;
}
export function mergeSettings(value: unknown): NewsSettings {
 const input = value && typeof value==="object" ? value as Partial<NewsSettings> : {};
 const intervalMinutes = Number(input.intervalMinutes ?? 60);
 if(!Number.isInteger(intervalMinutes)||intervalMinutes<15||intervalMinutes>360) throw new Error("La frecuencia debe estar entre 15 y 360 minutos.");
 const maxAgeDays = Number(input.maxAgeDays ?? DEFAULT_MAX_AGE_DAYS);
 if(!Number.isInteger(maxAgeDays)||maxAgeDays<3||maxAgeDays>365) throw new Error("La antigüedad máxima debe estar entre 3 y 365 días.");
 const supplied=Array.isArray(input.sources)?input.sources:[];
 const sources=DEFAULT_NEWS_SOURCES.map(base=>{
  const item=supplied.find(s=>s.id===base.id);if(!item)return {...base};
  const legacy=PREVIOUS_DEFAULT_URLS[base.id]?.includes(String(item.url))??false;
  const url=legacy?base.url:assertSourceUrl(String(item.url),base.hosts);
  const keywords=Array.isArray(item.keywords)?item.keywords.map(String).map(s=>s.trim().slice(0,60)).filter(Boolean).slice(0,20):base.keywords;
  const enabled=legacy&&ENABLE_ON_UPGRADE.has(base.id)?base.enabled:!!item.enabled;
  return {...base,url,enabled,kind:legacy?base.kind:item.kind==="rss"?"rss":"html",keywords};
 });
 const taken=new Set(sources.map(s=>s.url));const channels:NewsChannel[]=[];
 for(const raw of Array.isArray(input.channels)?input.channels:[]){
  const c=raw as Partial<NewsChannel>;const channelId=String(c.channelId??"").trim();
  if(!YOUTUBE_CHANNEL_ID.test(channelId))throw new Error("Cada canal necesita un identificador de YouTube válido (empieza con UC).");
  const name=String(c.name??"").trim().slice(0,80);if(name.length<3)throw new Error("Escribe el nombre del canal (mínimo 3 caracteres).");
  const category=(NEWS_CATEGORIES as readonly string[]).includes(String(c.category))?String(c.category):"Comunidad";
  const url=channelSource({channelId,name,category,enabled:true}).url;if(taken.has(url))continue;taken.add(url);
  channels.push({channelId,name,category,enabled:c.enabled!==false});
 }
 if(channels.length>30)throw new Error("Máximo 30 canales adicionales.");
 return {intervalMinutes,maxAgeDays,sources,channels};
}
export function safePublicUrl(value: string): string | null {
 try {const u=new URL(value);const h=u.hostname.toLowerCase();
  if(u.protocol!=="https:"||u.username||u.password||u.port||!h.includes(".")||/^\d+\./.test(h)||h.includes(":")||/(^|\.)(localhost|local|internal|test)$/.test(h))return null;
  return u.href;
 }catch{return null;}
}
export function safeImageUrl(value:string,base:string):string|null{
 if(!value.trim())return null;
 try{const u=new URL(value,base);return u.protocol==="https:" && !u.username && !u.password && !u.port && (u.hostname.endsWith(".unam.mx")||["unam.mx","www.pjecz.gob.mx","pjecz.gob.mx","dof.gob.mx","www.dof.gob.mx","www.scjn.gob.mx"].includes(u.hostname))?u.href:null;}catch{return null;}
}
