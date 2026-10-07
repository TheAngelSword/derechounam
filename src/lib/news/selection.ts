import type {NewsItem} from "./types.ts";
export type NewsPeriod="archivo"|"recientes"|"ano"|"sin-fecha";
export function publicationTime(item:NewsItem){const t=Date.parse(item.publishedAt??item.eventDate??"");return Number.isFinite(t)?t:null;}
export function selectNews(items:NewsItem[],{category="Todas",source="Todas",search="",period="archivo",saved,now=Date.now()}:{category?:string;source?:string;search?:string;period?:NewsPeriod;saved?:string[];now?:number}={}){
 const term=search.trim().toLocaleLowerCase("es");
 return items.filter(i=>{
  if(category!=="Todas"&&i.category!==category)return false;
  if(source!=="Todas"&&i.sourceId!==source)return false;
  if(saved&&!saved.includes(i.id))return false;
  if(term&&!`${i.title} ${i.summary} ${i.sourceName}`.toLocaleLowerCase("es").includes(term))return false;
  const t=publicationTime(i);if(period==="sin-fecha")return t===null;
  if(period!=="archivo")return t!==null&&t>=now-(period==="ano"?365:90)*86400000&&(!!i.eventDate||t<=now);
  return true;
 }).slice().sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||Number(!!a.snapshot)-Number(!!b.snapshot)||(publicationTime(b)??-Infinity)-(publicationTime(a)??-Infinity)||a.title.localeCompare(b.title));
}
/** A small editorial window, with source diversity. Never fabricate entries to fill cards. */
export function homeNews(items:NewsItem[],limit=3){const ordered=selectNews(items);const window=ordered.slice(0,12);const selected:NewsItem[]=[];for(const item of window){if(!selected.some(x=>x.sourceId===item.sourceId)||item.pinned)selected.push(item);if(selected.length===limit)return selected;}for(const item of ordered){if(!selected.includes(item))selected.push(item);if(selected.length===limit)break;}return selected;}
