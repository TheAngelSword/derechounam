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
const pad=(n:number)=>String(n).padStart(2,"0");
function face(time:ClockTime,variant:string){
 const hour=(time.hour%12)*30+time.minute/2, minute=time.minute*6,second=time.second*6;
 return <div className={"fd-aura-full-face "+variant} aria-label="Reloj analógico con hora, minutos y segundos">
  {Array.from({length:12},(_,i)=><span key={i} className="fd-aura-tick" style={{transform:"rotate("+i*30+"deg) translateY(-58px)"}}/>)}
  {Array.from({length:12},(_,i)=><span key={"number"+i} className="fd-original-dial-number" style={{left:(50+39*Math.sin((i+1)*Math.PI/6))+"%",top:(50-39*Math.cos((i+1)*Math.PI/6))+"%"}}>{i+1}</span>)}<span className="fd-original-dial-brand">AURA · CRONO</span><span className="fd-original-dial-sub">TEMPUS FUGIT</span><span className="fd-aura-hand h" style={{transform:"rotate("+hour+"deg)"}}/><span className="fd-aura-hand m" style={{transform:"rotate("+minute+"deg)"}}/><span className="fd-aura-hand s" style={{transform:"rotate("+second+"deg)"}}/><i className="fd-aura-center"/>
 </div>;
}
function ClockVisual({time,choice}:{time:ClockTime|null;choice:string}){
 const [type,style]=choice.split(":");const h=time?.hour??0,m=time?.minute??0,s=time?.second??0;
 const hh=pad(h),mm=pad(m),ss=pad(s),stamp=hh+":"+mm+":"+ss;
 if(type==="analog")return <div className={"fd-clock-showcase "+style}>{face({hour:h,minute:m,second:s},"fd-face-"+style)}</div>;
 if(type==="digital")return <div className={"fd-clock-showcase fd-clock-digital fd-digit-"+style}><div className="fd-original-digital-top">HORA EXACTA <span>•</span> EN TIEMPO REAL</div><div className="fd-digit-readout" aria-label={"Hora "+stamp}><strong>{hh}</strong><span>:</span><strong>{mm}</strong><span className="fd-digit-seconds">:{ss}</span></div><div className="fd-original-digital-bottom"><span>CIUDAD DE MÉXICO</span><span>24 HORAS</span></div></div>;
 if(type==="orbital")return <div className="fd-clock-showcase fd-clock-orbital"><div className="fd-aura-orbit-large"><span className="ring outer"/><span className="ring inner"/><i style={{transform:"rotate("+h/24*360+"deg) translateY(-63px)"}}/><b style={{transform:"rotate("+m/60*360+"deg) translateY(-39px)"}}/><strong>{hh}:{mm}</strong></div></div>;
 if(type==="mechanical")return <div className={"fd-clock-showcase fd-clock-mechanical "+style}><span className="fd-clock-gear first">⚙</span><span className="fd-clock-gear second">⚙</span>{style==="astronomico"?<span className="fd-clock-satellite">🪐</span>:null}{face({hour:h,minute:m,second:s},"fd-face-mechanical")}<small>{style==="tourbillon"?"TOURBILLON · INTERPRETACIÓN COMPACTA":style==="astronomico"?"ESFERA ASTRONÓMICA":"ESQUELETO · MECANISMO"}</small></div>;
 if(type==="animals")return <div className={"fd-clock-showcase fd-clock-animal "+style}><span className="fd-clock-animal-scene" aria-hidden="true">{style==="gato"?"🐈 🐭":style==="hamster"?"🐹 🎡":"🐌 🐞 🐝"}</span><strong>{stamp}</strong><small>{style==="gato"?"El ratón corre con los segundos":style==="hamster"?"La rueda marca el tiempo":"Jardín en movimiento"}</small></div>;
 if(type==="3d"){
  if(style==="codigo")return <div className="fd-clock-showcase fd-clock-code"><span className="fd-rain" aria-hidden="true">010 101 110 001 111 010 100 010 001 011</span><strong>{stamp}</strong></div>;
  if(style==="bloques")return <div className="fd-clock-showcase fd-clock-blocks"><span>🟧 🟦 🟨</span><strong>{hh}:{mm}</strong><small>MUNDO DE BLOQUES</small></div>;
  if(style==="retro")return <div className="fd-clock-showcase fd-clock-retro"><span className="fd-clock-retro-hall"/><strong>{stamp}</strong><small>ARCADE · RETRO FPS</small></div>;
  if(style==="baile")return <div className="fd-clock-showcase fd-clock-dance"><span>🕺 🪩 💃</span><strong>{hh}:{mm}</strong><small>PISTA DE BAILE</small></div>;
  return <div className="fd-clock-showcase fd-clock-solar"><div className="fd-solar-planets" aria-hidden="true">☀️　🪐　🌎　🌙</div><strong>{stamp}</strong><small>ÓRBITAS DEL SISTEMA SOLAR</small></div>;
 }
 if(type==="tetris")return <div className={"fd-clock-showcase fd-clock-tetris "+style}><span aria-hidden="true">▦ ▦ ▦ ▦ ▦</span><strong>{style==="turbo"?stamp:hh+":"+mm}</strong><small>RELOJ DE BLOQUES</small></div>;
 if(style==="palabras"){
  const formatter=new Intl.DateTimeFormat("es-MX",{timeZone:"UTC",hour:"numeric",minute:"2-digit",hour12:true});
  const spoken=formatter.format(new Date(Date.UTC(2026,0,1,h,m)));
  return <div className="fd-clock-showcase fd-clock-words"><small>SON LAS</small><strong>{spoken}</strong><span>Palabras · hora de México</span></div>;
 }
 if(style==="arena")return <div className="fd-clock-showcase fd-clock-sand"><span className="fd-clock-hourglass" aria-hidden="true">⌛</span><strong>{hh}:{mm}</strong><small>{ss} segundos</small></div>;
 return <div className="fd-clock-showcase fd-clock-landscape"><span aria-hidden="true">{h>=6&&h<19?"🌄 ☀️ 🏞️":"🌌 🌙 ⭐"}</span><strong>{hh}:{mm}</strong><small>PAISAJE · CICLO SOLAR</small></div>;
}
export function AuraClockSelector({time}:{time:ClockTime|null}){
 const [choice,setChoice]=useState<string>("analog:atelier");
 const showcase=useRef<HTMLElement|null>(null);
 useEffect(()=>{try{const stored=window.localStorage.getItem("fd-aura-clock-choice");if(stored&&CLOCKS.some(c=>c[0]===stored))setChoice(stored);}catch{}},[]);
 const groups=[...new Set(CLOCKS.map(c=>c[1]))];
 return <article ref={showcase} className="fd-aura-time-card fd-aura-clock-picker" aria-label="Relojes seleccionables de Aura Crono">
  <div className="fd-aura-picker-heading"><span>RELOJ PERSONALIZABLE</span><small>{AURA_CLOCK_COUNT} estilos</small></div>
  <label htmlFor="fd-aura-clock-style">Estilo de reloj</label>
  <select id="fd-aura-clock-style" value={choice} onChange={event=>{const id=event.target.value;setChoice(id);try{localStorage.setItem("fd-aura-clock-choice",id);}catch{}}}>{groups.map(group=><optgroup key={group} label={group}>{CLOCKS.filter(c=>c[1]===group).map(c=><option key={c[0]} value={c[0]}>{c[2]}</option>)}</optgroup>)}</select>
  <ClockVisual choice={choice} time={time}/>
  <button type="button" className="fd-clock-expand" onClick={()=>{if(showcase.current?.requestFullscreen)void showcase.current.requestFullscreen();}}>⛶ Ampliar reloj</button>
  <small className="fd-clock-zone">Hora de Ciudad de México · {time?stampLabel(time):"Sincronizando…"}</small>
 </article>;
}
const stampLabel=(t:ClockTime)=>pad(t.hour)+":"+pad(t.minute)+":"+pad(t.second);
