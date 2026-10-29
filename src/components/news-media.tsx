import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { loadArticleMedia } from "@/lib/news/media-function";
import { coverCandidates, type ArticleMedia } from "@/lib/news/media";
import { DEFAULT_NEWS_SOURCES } from "@/lib/news/sources";
import type { NewsItem } from "@/lib/news/types";
// Share a small queue across cards, so scrolling never starts dozens of requests together.
let active=0;const waiting:Array<()=>void>=[];
function enqueue<T>(job:()=>Promise<T>):Promise<T>{return new Promise((resolve,reject)=>{const run=()=>{active++;void job().then(resolve,reject).finally(()=>{active--;waiting.shift()?.();});};if(active<3)run();else waiting.push(run);});}
export function useNewsMedia(item:NewsItem){
 const element=useRef<HTMLElement|null>(null);const [visible,setVisible]=useState(false);const [failed,setFailed]=useState<string[]>([]);
 useEffect(()=>{setFailed([]);},[item.sourceUrl,item.imageUrl]);
 useEffect(()=>{const node=element.current;if(!node)return;if(!("IntersectionObserver" in window)){setVisible(true);return;}const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:"160px"});observer.observe(node);return()=>observer.disconnect();},[item.sourceUrl]);
 const official=item.sourceId!=="editorial"&&DEFAULT_NEWS_SOURCES.some(s=>{try{return s.hosts.includes(new URL(item.sourceUrl).hostname);}catch{return false;}});
 const query=useQuery({queryKey:["news-article-media-v761",item.sourceUrl],queryFn:()=>enqueue(()=>loadArticleMedia({data:{url:item.sourceUrl}})),enabled:visible&&official&&(!item.imageUrl||failed.length>0),staleTime:3600_000,retry:2,retryDelay:attempt=>1000*(attempt+1)});
 const media=query.data as ArticleMedia|undefined;
 // Never change headline, date, archive status or destination from an image response.
 const effective:NewsItem={...item,imageUrl:media?.imageUrl??item.imageUrl,imageCredit:media?.imageCredit??item.imageCredit,youtubeId:media?.youtubeId??item.youtubeId,videoUrl:media?.videoUrl??item.videoUrl};
 const candidates=coverCandidates({...effective,imageCandidates:media?.imageCandidates??(item as ArticleMedia).imageCandidates} as NewsItem);
 const cover=candidates.find(url=>!failed.includes(url))??null;
 function rejectImage(){if(cover)setFailed(previous=>previous.includes(cover)?previous:[...previous,cover]);}
 return {element,item:effective,cover,rejectImage,loading:query.isFetching};
}
