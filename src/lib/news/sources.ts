import type { NewsSource, NewsSettings } from "./types.ts";
export const DEFAULT_NEWS_SOURCES: NewsSource[] = [
  {id:"dua",name:"Universidad Abierta · DUA",url:"https://duaderecho.unam.mx/",homepage:"https://duaderecho.unam.mx/",hosts:["duaderecho.unam.mx"],category:"Universidad Abierta",kind:"html",enabled:true,note:"Sitio oficial de modalidad abierta. Adaptador HTML: si el contenido depende de JavaScript, se informa el fallo y se conserva la última lectura; no se presupone un RSS.",keywords:["sua","convocatoria","aviso","inscripción","examen","programa","calendario","evento","derecho","seminario"]},
  {id:"facultad",name:"Facultad de Derecho · Agenda",url:"https://www.derecho.unam.mx/eventos/",homepage:"https://www.derecho.unam.mx/eventos/",hosts:["www.derecho.unam.mx","derecho.unam.mx"],category:"Facultad",kind:"html",enabled:true,note:"Agenda institucional. La fecha del evento no se presenta como fecha de publicación. Confirma cambios y año en el cartel original.",keywords:["derecho","libro","conferencia","taller","curso","seminario","jornada","congreso","presentación"]},
  {id:"gaceta",name:"Gaceta UNAM · Derecho",url:"https://www.gaceta.unam.mx/tag/facultad-de-derecho/",homepage:"https://www.gaceta.unam.mx/tag/facultad-de-derecho/",hosts:["www.gaceta.unam.mx","gaceta.unam.mx"],category:"Facultad",kind:"html",enabled:true,note:"Portada temática oficial. El RSS terminado en /feed/ no pudo verificarse: sólo actívalo después de probarlo desde Control. De inicio se utiliza el adaptador HTML.",keywords:[]},
  {id:"dof",name:"Diario Oficial de la Federación",url:"https://dof.gob.mx/index.php",homepage:"https://dof.gob.mx/website/filtroRss.php",hosts:["dof.gob.mx","www.dof.gob.mx"],category:"Legislación",kind:"html",enabled:true,note:"Puedes sustituir el adaptador por el enlace RSS generado en el filtro oficial. La página filtroRss.php es un configurador, no un feed. La publicación no implica entrada en vigor inmediata: consulta transitorios.",keywords:["decreto","reforma","adiciona","deroga","ley","constitución","código","reglamento"]},
  {id:"scjn",name:"Suprema Corte · Comunicados",url:"https://www.internet2.scjn.gob.mx/red2/comunicados/",homepage:"https://www.internet2.scjn.gob.mx/red2/comunicados/",hosts:["www.internet2.scjn.gob.mx","internet2.scjn.gob.mx"],category:"Justicia",kind:"html",enabled:false,note:"Consulta oficial. Desactivada hasta comprobar acceso y resultados del adaptador; un comunicado no equivale por sí solo a jurisprudencia.",keywords:["corte","derecho","constituc","resuelve","invalida","sentencia"]},
  {id:"diputados",name:"Cámara de Diputados · Reformas",url:"https://www.diputados.gob.mx/LeyesBiblio/ref/index.htm",homepage:"https://www.diputados.gob.mx/LeyesBiblio/ref/index.htm",hosts:["www.diputados.gob.mx","diputados.gob.mx"],category:"Legislación",kind:"html",enabled:false,note:"Índice de referencia de reformas. No se ha confirmado un RSS. Requiere probar el adaptador antes de habilitarlo.",keywords:["ley","código","decreto","reforma","constitución"]},
  {id:"pj-coahuila",name:"Poder Judicial de Coahuila",url:"https://www.pjecz.gob.mx/feeds/comunicados.rss.xml",homepage:"https://www.pjecz.gob.mx/consultas/fuentes-rss/",hosts:["www.pjecz.gob.mx","pjecz.gob.mx"],category:"Justicia",kind:"rss",enabled:false,note:"RSS documentado en la página oficial; la respuesta del feed debe probarse en el servidor. Jurisdicción estatal: Coahuila, no legislación federal ni información de la UNAM.",keywords:[]},
];
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
    const url=assertSourceUrl(String(item.url),base.hosts);
    const keywords=Array.isArray(item.keywords)?item.keywords.map(String).map(s=>s.trim().slice(0,60)).filter(Boolean).slice(0,20):base.keywords;
    return {...base,url,enabled:!!item.enabled,kind:item.kind==="rss"?"rss":"html",keywords};
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
