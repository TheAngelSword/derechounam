// Read-only checks of the four public source articles; no portal credentials or DB.
import {parseArticleMedia,coverCandidates} from '../src/lib/news/media.ts';
const slugs=[
 'especialistas-de-once-paises-en-congreso-virtual-de-derecho-penal',
 'sin-la-unam-mexico-no-habria-avanzado-hay-que-defenderla-siempre-monreal',
 'mirada-de-un-especialista-a-los-pros-y-contras-del-juicio-de-amparo',
 'cumple-setenta-anos-de-excelencia-academica-el-doctorado-en-derecho'
];
let failures=0;
for(const slug of slugs){
 const url='https://www.gaceta.unam.mx/'+slug+'/';
 try{
  const r=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'FacultadDerechoStudentPortal/7.6.1 (+educational-news-reader)'}});if(!r.ok)throw Error('Artículo HTTP '+r.status);
  const html=await r.text();const media=parseArticleMedia(html,url,'Gaceta UNAM');
  const candidates=coverCandidates(media as any);let reachable:string|null=null;
  for(const image of candidates){try{const response=await fetch(image,{signal:AbortSignal.timeout(10000),headers:{Range:'bytes=0-1023'}});const ok=response.ok&&!!response.headers.get('content-type')?.startsWith('image/');await response.body?.cancel();if(ok){reachable=image;break;}}catch{}}
  console.log(JSON.stringify({article:slug,htmlBytes:html.length,youtubeId:media.youtubeId??null,imageUrl:media.imageUrl??null,candidates,reachableImage:reachable,publishedAt:media.publishedAt??null}));
  if(!reachable)failures++;
  if(slug.includes('juicio-de-amparo')&&!media.youtubeId){console.error('Video de amparo no detectado');failures++;}
 }catch(e){failures++;console.error(JSON.stringify({article:slug,error:e instanceof Error?e.message:String(e)}));}
}
console.log('SOURCE_MEDIA_FAILURES='+failures);process.exitCode=failures?1:0;
