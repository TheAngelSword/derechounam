import { useEffect, useRef, useState } from "react";
export type ClockTime={hour:number;minute:number;second:number};
const CLOCKS=[
 ["analog:atelier","Analógico","Atelier"],["analog:pilot","Analógico","Aviador"],["analog:zen","Analógico","Zen"],["analog:stellar","Analógico","Estelar"],
 ["digital:glass","Digital","Cristal"],["digital:led","Digital","LED"],["digital:flip","Digital","Flip"],["digital:editorial","Digital","Editorial"],
 ["orbital:orbit","Experimental","Órbita temporal"],
 ["mechanical:esqueleto","Mecánico","Esqueleto dorado"],["mechanical:tourbillon","Mecánico","Tourbillon"],["mechanical:astronomico","Mecánico","Astronómico 3D"],
 ["animals:gato","Animales","Gato vs. ratón"],["animals:hamster","Animales","Hámster en la rueda"],["animals:jardin","Animales","Jardín de bichos"],
 ["3d:solar","3D y arcade","Sistema solar"],["3d:codigo","3D y arcade","Lluvia de código"],["3d:bloques","3D y arcade","Mundo de bloques"],["3d:retro","3D y arcade","Pasillo retro FPS"],["3d:baile","3D y arcade","Pista de baile"],
 ["tetris:clasico","Tetris","Clásico"],["tetris:turbo","Tetris","Turbo + segundos"],["tetris:gameboy","Tetris","Retro verde"],
 ["creative:palabras","Creativos","Palabras"],["creative:arena","Creativos","Reloj de arena"],["creative:paisaje","Creativos","Paisaje real"],
] as const;
export const AURA_CLOCK_COUNT=CLOCKS.length;
export function AuraClockSelector({time}:{time:ClockTime|null}){
 const [choice,setChoice]=useState<string>("analog:atelier");
 const frame=useRef<HTMLIFrameElement|null>(null);
 const showcase=useRef<HTMLElement|null>(null);
 useEffect(()=>{try{const stored=window.localStorage.getItem("fd-aura-clock-choice");if(stored&&CLOCKS.some(c=>c[0]===stored))setChoice(stored);}catch{}},[]);
 useEffect(()=>{
  function onMessage(event:MessageEvent){
   if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow)return;
   if(event.data?.type==="portal-aura-ready"){
    frame.current?.contentWindow?.postMessage({type:"portal-aura-set-clock",choice},window.location.origin);
   }
  }
  window.addEventListener("message",onMessage);
  return()=>window.removeEventListener("message",onMessage);
 },[choice]);
 useEffect(()=>{
  // La página de Aura carga varios motores: al cambiar de estilo durante esa
  // carga, el primer mensaje podría perderse. Confirmamos el cambio realmente
  // aplicado en los controles originales antes de detener los reintentos.
  let attempts=0;
  const [type]=choice.split(":");
  const targetIndex=CLOCKS.filter(item=>item[0].startsWith(type+":")).findIndex(item=>item[0]===choice);
  const update=()=>{
   try{
    const doc=frame.current?.contentDocument;
    const activeType=doc?.querySelector<HTMLButtonElement>('#clockTypeSelector button.active')?.dataset.clock;
    const styles=Array.from(doc?.querySelectorAll('#styleSelector button')??[]);
    const activeIndex=styles.findIndex(button=>button.classList.contains("active"));
    if(activeType===type&&activeIndex===targetIndex&&styles.length>0){window.clearInterval(timer);return;}
   }catch{/* El documento aún no ha cargado; seguimos intentando. */}
   frame.current?.contentWindow?.postMessage({type:"portal-aura-set-clock",choice},window.location.origin);
   if(++attempts>=45)window.clearInterval(timer);
  };
  const timer=window.setInterval(update,350);
  update();
  return()=>window.clearInterval(timer);
 },[choice]);
 const groups=[...new Set(CLOCKS.map(c=>c[1]))];
 return <article ref={showcase} className="fd-aura-time-card fd-aura-clock-picker fd-aura-native-picker" aria-label="Relojes originales de Aura Crono v3">
   <div className="fd-aura-picker-heading"><span>RELOJ AURA CRONO ORIGINAL</span><small>{AURA_CLOCK_COUNT} estilos</small></div>
   <label htmlFor="fd-aura-clock-style">Estilo de reloj</label>
   <select id="fd-aura-clock-style" value={choice} onChange={event=>{const selected=event.target.value;setChoice(selected);try{localStorage.setItem("fd-aura-clock-choice",selected);}catch{}}}>
     {groups.map(group=><optgroup key={group} label={group}>{CLOCKS.filter(c=>c[1]===group).map(c=><option key={c[0]} value={c[0]}>{c[2]}</option>)}</optgroup>)}
   </select>
   <div className="fd-native-clock-frame">
    <iframe ref={frame} src="/aura-native/index.html?embed=1" title="Reloj Aura Crono v3 con animaciones originales" loading="eager" sandbox="allow-scripts allow-same-origin" onLoad={()=>{frame.current?.contentWindow?.postMessage({type:"portal-aura-set-clock",choice},window.location.origin);}}/>
   </div>
   <button type="button" className="fd-clock-expand" onClick={()=>{if(showcase.current?.requestFullscreen)void showcase.current.requestFullscreen();}}>⛶ Ampliar reloj</button>
   <small className="fd-clock-zone">Hora de Ciudad de México · {time?[time.hour,time.minute,time.second].map(n=>String(n).padStart(2,"0")).join(":"):"Sincronizando…"}</small>
 </article>;
}
