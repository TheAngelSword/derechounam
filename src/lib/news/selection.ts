import type { NewsItem } from "./types.ts";
export type NewsPeriod = "dia" | "72h" | "archivo" | "recientes" | "ano" | "sin-fecha";
export function publicationTime(item:NewsItem){const value=Date.parse(item.publishedAt??"");return Number.isFinite(value)?value:null;}
export function isCurrentNews(item:NewsItem,now=Date.now(),hours=72):boolean {
 const published=publicationTime(item);
 return !item.snapshot && published!==null && published<=now+300000 && published>=now-hours*3600000;
}
export function selectNews(items:NewsItem[],{category="Todas",source="Todas",search="",period="archivo",saved,now=Date.now()}:{category?:string;source?:string;search?:string;period?:NewsPeriod;saved?:string[];now?:number}={}){
 const term=search.trim().toLocaleLowerCase("es");
 return items.filter(item=>{
  if(category!=="Todas"&&item.category!==category)return false;
  if(source!=="Todas"&&item.sourceId!==source)return false;
  if(saved&&!saved.includes(item.id))return false;
  if(term&&!(item.title+" "+item.summary+" "+item.sourceName).toLocaleLowerCase("es").includes(term))return false;
  if(period==="dia")return isCurrentNews(item,now,24);
  if(period==="72h")return isCurrentNews(item,now,72);
  const date=publicationTime(item);
  if(period==="sin-fecha")return date===null;
  if(period!=="archivo")return date!==null&&date<=now+300000&&date>=now-(period==="ano"?365:90)*86400000;
  return true;
 }).slice().sort((a,b)=>{
   const at=publicationTime(a)??-Infinity,bt=publicationTime(b)??-Infinity;
   return Number(isCurrentNews(b,now))-Number(isCurrentNews(a,now)) || (isCurrentNews(a,now)&&isCurrentNews(b,now)?Number(!!b.pinned)-Number(!!a.pinned):0) || bt-at || a.title.localeCompare(b.title);
 });
}
export function homeNews(items:NewsItem[],limit=3,now=Date.now()):NewsItem[]{
 const fresh=selectNews(items,{period:"72h",now});const selected:NewsItem[]=[];
 for(const item of fresh){if(!selected.some(other=>other.sourceId===item.sourceId))selected.push(item);if(selected.length>=limit)return selected;}
 for(const item of fresh){if(!selected.includes(item))selected.push(item);if(selected.length>=limit)break;}
 return selected;
}
