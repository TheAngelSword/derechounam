import type { NewsSource, NewsSettings } from "./types.ts";
export const DEFAULT_NEWS_SOURCES: NewsSource[] = [
 {id:"gaceta-actualidad",name:"Gaceta UNAM · Actualidad jurídica",url:"https://www.gaceta.unam.mx/?s=jur%C3%ADdic&feed=rss2",homepage:"https://www.gaceta.unam.mx/",hosts:["www.gaceta.unam.mx","gaceta.unam.mx"],category:"Comunidad",kind:"rss",enabled:true,note:"RSS oficial de búsqueda de Gaceta UNAM (notas sobre temas jurídicos, ordenadas por fecha). Se filtra por palabras del título, resumen y categorías; se conservan las fechas originales.",keywords:["derecho","justicia","jurídic","constituc","suayed","reforma","tribunal","abierta","electoral","democracia","ley general"]},
 {id:"buho",name:"El Búho · Gaceta de Derecho",url:"https://revistas.unam.mx/index.php/derecho/gateway/plugin/WebFeedGatewayPlugin/rss2",homepage:"https://revistas.unam.mx/index.php/derecho",hosts:["revistas.unam.mx","www.revistas.unam.mx"],category:"Facultad",kind:"rss",enabled:true,note:"RSS oficial de la revista (OJS). Ensayos y cultura jurídica, no noticias de última hora ni resoluciones judiciales. El sitio usa protección anti-bots: si bloquea la lectura, se informa el fallo.",keywords:[]},
 {id:"dua",name:"Universidad Abierta · DUA",url:"https://duaderecho.unam.mx/",homepage:"https://duaderecho.unam.mx/",hosts:["duaderecho.unam.mx"],category:"Universidad Abierta",kind:"html",enabled:true,note:"Sitio oficial de modalidad abierta. Adaptador HTML: si el contenido depende de JavaScript, se informa el fallo y se conserva la última lectura; no se presupone un RSS.",keywords:["sua","convocatoria","aviso","inscripción","examen","programa","calendario","evento","derecho","seminario"]},
 {id:"facultad",name:"Facultad de Derecho · Agenda",url:"https://www.derecho.unam.mx/eventos/",homepage:"https://www.derecho.unam.mx/eventos/",hosts:["www.derecho.unam.mx","derecho.unam.mx"],category:"Facultad",kind:"html",enabled:true,note:"Agenda institucional. La fecha del evento no se presenta como fecha de publicación. Confirma cambios y año en el cartel original.",keywords:["derecho","libro","conferencia","taller","curso","seminario","jornada","congreso","presentación"]},
 {id:"gaceta",name:"Gaceta UNAM · Derecho",url:"https://www.gaceta.unam.mx/tag/facultad-de-derecho/feed/",homepage:"https://www.gaceta.unam.mx/tag/facultad-de-derecho/",hosts:["www.gaceta.unam.mx","gaceta.unam.mx"],category:"Facultad",kind:"rss",enabled:true,note:"RSS oficial de la etiqueta Facultad de Derecho en Gaceta UNAM, con fecha de publicación. Gaceta etiqueta pocas notas; las de más de un año no se muestran.",keywords:[]},
 {id:"dof",name:"Diario Oficial de la Federación",url:"https://dof.gob.mx/sumario.xml",homepage:"https://dof.gob.mx/website/filtroRss.php",hosts:["dof.gob.mx","www.dof.gob.mx"],category:"Legislación",kind:"rss",enabled:true,note:"Sumario RSS oficial del día, filtrado por decretos, reformas, leyes y reglamentos. La publicación no implica entrada en vigor inmediata: consulta transitorios.",keywords:["decreto","reforma","adiciona","deroga","ley","constitución","código","reglamento","acuerdo general","sentencia","norma oficial","lineamientos"]},
 {id:"scjn",name:"Suprema Corte · Comunicados",url:"https://www.internet2.scjn.gob.mx/red2/comunicados/",homepage:"https://www.internet2.scjn.gob.mx/red2/comunicados/",hosts:["www.internet2.scjn.gob.mx","internet2.scjn.gob.mx"],category:"Justicia",kind:"html",enabled:false,note:"Consulta oficial. Desactivada hasta comprobar acceso y resultados del adaptador; un comunicado no equivale por sí solo a jurisprudencia.",keywords:["corte","derecho","constituc","resuelve","invalida","sentencia"]},
 {id:"diputados",name:"Cámara de Diputados · Reformas",url:"https://www.diputados.gob.mx/LeyesBiblio/ref/index.htm",homepage:"https://www.diputados.gob.mx/LeyesBiblio/ref/index.htm",hosts:["www.diputados.gob.mx","diputados.gob.mx"],category:"Legislación",kind:"html",enabled:false,note:"Índice de referencia de reformas. No se ha confirmado un RSS. Requiere probar el adaptador antes de habilitarlo.",keywords:["ley","código","decreto","reforma","constitución"]},
 {id:"pj-coahuila",name:"Poder Judicial de Coahuila",url:"https://www.pjecz.gob.mx/feeds/comunicados.rss.xml",homepage:"https://www.pjecz.gob.mx/consultas/fuentes-rss/",hosts:["www.pjecz.gob.mx","pjecz.gob.mx"],category:"Justicia",kind:"rss",enabled:false,note:"RSS documentado en la página oficial; la respuesta del feed debe probarse en el servidor. Jurisdicción estatal: Coahuila, no legislación federal ni información de la UNAM.",keywords:[]},
];
/** URLs that earlier versions shipped as defaults; saved settings that still use them move to the current default. */
const PREVIOUS_DEFAULT_URLS:Record<string,string[]>={"gaceta-actualidad":["https://www.gaceta.unam.mx/"],buho:["https://revistas.unam.mx/index.php/derecho"],gaceta:["https://www.gaceta.unam.mx/tag/facultad-de-derecho/"],dof:["https://dof.gob.mx/index.php"]};
/** Automatic entries older than this are not shown (a tag archive can go back years). */
export const NEWS_MAX_AGE_DAYS=365;
export const DEFAULT_NEWS_SETTINGS: NewsSettings = {intervalMinutes:60,sources:DEFAULT_NEWS_SOURCES};
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
 const supplied=Array.isArray(input.sources)?input.sources:[];
 return {intervalMinutes,sources:DEFAULT_NEWS_SOURCES.map(base=>{
  const item=supplied.find(s=>s.id===base.id);if(!item)return {...base};
  const legacy=PREVIOUS_DEFAULT_URLS[base.id]?.includes(String(item.url))??false;
  const url=legacy?base.url:assertSourceUrl(String(item.url),base.hosts);
  const keywords=Array.isArray(item.keywords)?item.keywords.map(String).map(s=>s.trim().slice(0,60)).filter(Boolean).slice(0,20):base.keywords;
  return {...base,url,enabled:!!item.enabled,kind:legacy?base.kind:item.kind==="rss"?"rss":"html",keywords};
 })};
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
