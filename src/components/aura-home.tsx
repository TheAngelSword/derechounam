import { useEffect, useRef, useState } from "react";
import { AuraClockSelector } from "./aura-clock-selector";
import { AURA_STATIONS,AURA_STATION_GENRES } from "@/lib/aura/stations";
import { AURA_OBSERVANCES } from "@/lib/aura/observances";
import { Clock3, MapPin, Music2, Play, Pause, RefreshCw, History, ThermometerSun, CalendarClock, ExternalLink, LocateFixed, RadioTower, Scale, BookOpenText } from "lucide-react";

type Weather={temperature:number;code:number;label:string;days:{date:string;min:number;max:number;code:number}[];hourly:{time:string;temp:number;rain:number;code:number}[]};
type Holiday={name:string;description:string;source:"Wikipedia"|"Calendario editorial"};
type HistoryEvent={year:number;text:string;url:string};
type Phrase={id:string;text:string};
const timezone="America/Mexico_City";
const compactDate=(date:Date)=>new Intl.DateTimeFormat("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:timezone}).format(date);
const cityDate=(date:Date)=>new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"2-digit",day:"2-digit",timeZone:timezone}).format(date);
const dateNumbers=(date:Date)=>Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:timezone,hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date).map(p=>[p.type,Number(p.value)]));
const pad=(value:number)=>String(value).padStart(2,"0");
const WEATHER_LABELS:Record<number,string>={0:"Despejado",1:"Mayormente despejado",2:"Parcialmente nublado",3:"Nublado",45:"Niebla",48:"Niebla",51:"Llovizna",53:"Llovizna",55:"Llovizna",61:"Lluvia",63:"Lluvia",65:"Lluvia intensa",71:"Nieve",73:"Nieve",75:"Nieve",80:"Chubascos",81:"Chubascos",82:"Lluvia intensa",95:"Tormenta",96:"Tormenta",99:"Tormenta"};
const stations=AURA_STATIONS;
function countdown(now:Date|null,year:number,month:number,day:number){
 if(!now)return "—";
 const remaining=Date.UTC(year,month-1,day+1,6)-now.getTime();
 if(remaining<=0)return "Finalizado";
 const days=Math.floor(remaining/86400000),hours=Math.floor(remaining%86400000/3600000),minutes=Math.floor(remaining%3600000/60000);
 return days+" d · "+pad(hours)+" h · "+pad(minutes)+" min";
}
function SeasonalMascot({month}:{month:number}){
 const phase=month===12?{label:"Cierre de año",theme:"winter"}:month===11?{label:"Recta final del semestre",theme:"autumn"}:month===10?{label:"Otoño jurídico",theme:"autumn"}:month<=3?{label:"Nuevo ciclo",theme:"spring"}:month<=6?{label:"Temporada de estudio",theme:"spring"}:{label:"Cultura universitaria",theme:"summer"};
 return <div className={"fd-aura-mascot fd-aura-puma-scene "+phase.theme} aria-label={"Puma café universitario. "+phase.label}>
  <img src="/brand/puma-cafe.svg" width={150} height={158} className="fd-aura-puma" alt="Mascota puma café, sin accesorios" loading="eager" />
  <small>{phase.label}</small>
 </div>;
}
function MiniAnalog({time}:{time:Record<string,number>|null}){
 const hour=((time?.hour??0)%12)*30+(time?.minute??0)/2,minute=(time?.minute??0)*6,second=(time?.second??0)*6;
 return <div className="fd-aura-clockface" aria-label="Reloj analógico">
  {Array.from({length:12},(_,i)=><i key={i} style={{transform:"rotate("+i*30+"deg) translateY(-41px)"}}/>)}
  <b className="fd-hand hour" style={{transform:"rotate("+hour+"deg)"}}/><b className="fd-hand minute" style={{transform:"rotate("+minute+"deg)"}}/><b className="fd-hand second" style={{transform:"rotate("+second+"deg)"}}/><b className="fd-pivot"/>
 </div>;
}
function MiniOrbit({time}:{time:Record<string,number>|null}){
 const hrs=time?.hour??0,mins=time?.minute??0;
 return <div className="fd-orbit-clock" aria-label="Reloj órbita temporal"><span className="fd-orbit-outer"/><span className="fd-orbit-inner"/><i style={{transform:"rotate("+hrs/24*360+"deg) translateY(-45px)"}}/><b style={{transform:"rotate("+mins/60*360+"deg) translateY(-27px)"}}/><strong>{pad(hrs)}:{pad(mins)}</strong></div>;
}
export function AuraHome(){
 const[now,setNow]=useState<Date|null>(null),[weather,setWeather]=useState<Weather|null>(null),[weatherError,setWeatherError]=useState(""),[coords,setCoords]=useState({lat:19.4326,lon:-99.1332,name:"Ciudad de México · referencia inicial"}),[locating,setLocating]=useState(false);
 const[history,setHistory]=useState<HistoryEvent[]>([]),[historyError,setHistoryError]=useState(""),[phrases,setPhrases]=useState<Phrase[]>([]),[phraseError,setPhraseError]=useState(false);
 const[station,setStation]=useState(()=>Math.max(0,stations.findIndex(item=>item.id==="spacestation"))),[playing,setPlaying]=useState(false),[radioError,setRadioError]=useState(""),[sourceIndex,setSourceIndex]=useState(0);
 const[holidays,setHolidays]=useState<Holiday[]>([]),[holidayStatus,setHolidayStatus]=useState(""),[phraseIndex,setPhraseIndex]=useState(0);
 const audio=useRef<HTMLAudioElement>(null);
 useEffect(()=>{const tick=()=>setNow(new Date());tick();const t=setInterval(tick,1000);return()=>clearInterval(t)},[]);
 const today=now?cityDate(now):null;
 useEffect(()=>{setPhraseIndex(0);if(phrases.length<2)return;const id=window.setInterval(()=>setPhraseIndex(i=>(i+1)%phrases.length),10000);return()=>window.clearInterval(id);},[today,phrases.length]);
 const time=now?dateNumbers(now):null;
 const month=now?Number(today?.split("-")[1]):10,year=now?Number(today?.slice(0,4)):2026;
 useEffect(()=>{if(!today)return;let active=true;
  const parts=today.split("-");const url="https://es.wikipedia.org/api/rest_v1/feed/onthisday/events/"+parts[1]+"/"+parts[2];
  setHistory([]);setHistoryError("");setPhraseIndex(0);
  setHolidays([]);setHolidayStatus("");
  const note=AURA_OBSERVANCES[parts[1]+"-"+parts[2]];
  fetch("https://es.wikipedia.org/api/rest_v1/feed/onthisday/holidays/"+parts[1]+"/"+parts[2]).then(async res=>{if(!res.ok)throw Error("Sin feed");return res.json();}).then(data=>{
   if(!active)return;
   const list=(Array.isArray(data.holidays)?data.holidays:[]).filter((x:unknown)=>typeof x==="object"&&x!==null).map((h:{text?:string})=>String(h.text??"").trim()).filter(Boolean).slice(0,2);
   if(list.length)setHolidays(list.map((name:string)=>({name,description:"Celebración mencionada en el feed de efemérides de Wikipedia.",source:"Wikipedia" as const})));
   else if(note){setHolidays([{name:note.name,description:note.description,source:"Calendario editorial"}]);setHolidayStatus("El feed no presentó celebraciones verificadas; se muestra el calendario de Aura Crono.");}
   else setHolidayStatus("Sin celebración identificada en las fuentes consultadas.");
  }).catch(()=>{if(!active)return;if(note){setHolidays([{name:note.name,description:note.description,source:"Calendario editorial"}]);setHolidayStatus("Wikipedia no respondió; fecha del calendario Aura Crono.");}else setHolidayStatus("El feed de celebraciones no está disponible hoy.");});
  fetch(url).then(async r=>{if(!r.ok)throw Error("No disponible");return r.json()}).then(data=>{
   if(!active)return;const seen=new Set<string>();
   const events=(Array.isArray(data.events)?data.events:[]).filter((e:unknown)=>typeof e==="object"&&e!==null).map((e:{year:number;text:string;pages?:{content_urls?:{desktop?:{page?:string}}}[]})=>{
    const url=e.pages?.[0]?.content_urls?.desktop?.page??"https://es.wikipedia.org/wiki/"+parts[2]+"_de_"+new Intl.DateTimeFormat("es",{month:"long",timeZone:timezone}).format(now??new Date());
    return {year:Number(e.year),text:String(e.text??""),url:String(url)};
   }).filter((e:HistoryEvent)=>{const key=e.year+"-"+e.text;if(!e.text||seen.has(key))return false;seen.add(key);return true;}).slice(0,7);
   setHistory(events);if(!events.length)setHistoryError("Hoy no hay efemérides disponibles desde Wikipedia.");
  }).catch(()=>{if(active)setHistoryError("No se pudo consultar Wikipedia; puedes abrir el archivo histórico.")});
  fetch("/api/frases").then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{if(active)setPhrases(Array.isArray(d.items)?d.items.slice(0,20):[])}).catch(()=>{if(active)setPhraseError(true)});
  return()=>{active=false};
 },[today]);
 useEffect(()=>{let active=true;setWeatherError("");setWeather(null);
  const base="https://api.open-meteo.com/v1/forecast?latitude="+coords.lat+"&longitude="+coords.lon+"&current=temperature_2m,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&forecast_hours=10&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5";
  fetch(base).then(r=>{if(!r.ok)throw Error("Sin datos meteorológicos");return r.json()}).then(d=>{if(!active)return;const daily=d.daily??{};setWeather({temperature:Number(d.current?.temperature_2m),code:Number(d.current?.weather_code),label:WEATHER_LABELS[Number(d.current?.weather_code)]??"Variable",days:(daily.time??[]).slice(0,5).map((date:string,i:number)=>({date,min:Number(daily.temperature_2m_min[i]),max:Number(daily.temperature_2m_max[i]),code:Number(daily.weather_code[i])})),hourly:(d.hourly?.time??[]).slice(0,8).map((t:string,i:number)=>({time:t.slice(11,16),temp:Number(d.hourly.temperature_2m[i]),rain:Number(d.hourly.precipitation_probability[i]),code:Number(d.hourly.weather_code[i])}))});}).catch(()=>{if(active)setWeatherError("Clima no disponible en este momento.")});
  return()=>{active=false};
 },[coords.lat,coords.lon]);
 function locate(){if(!navigator.geolocation){setWeatherError("Tu navegador no permite geolocalización.");return}setLocating(true);navigator.geolocation.getCurrentPosition(p=>{setCoords({lat:Number(p.coords.latitude.toFixed(3)),lon:Number(p.coords.longitude.toFixed(3)),name:"Tu ubicación aproximada"});setLocating(false);},()=>{setLocating(false);setWeatherError("Ubicación no autorizada. Se muestra el clima de referencia de Ciudad de México.")},{timeout:10000,maximumAge:600000});}
 function startStation(index=station,alternate=0){const a=audio.current;if(!a)return;setStation(index);setSourceIndex(alternate);setRadioError("");a.src=stations[index].urls[alternate];a.volume=0.6;a.play().then(()=>setPlaying(true)).catch(()=>{setPlaying(false);setRadioError("El navegador o la emisora impidió la reproducción. Prueba otra estación.")});}
 function toggleRadio(){if(!audio.current)return;if(playing){audio.current.pause();setPlaying(false)}else startStation()}
 function radioFailure(){const next=sourceIndex+1;if(next<stations[station].urls.length){startStation(station,next)}else{setPlaying(false);setRadioError("Emisora temporalmente no disponible. Selecciona otra.")}}
 const currentYear=year||2026, newYearTarget=Date.UTC(currentYear+1,0,1,6), endYear=countdown(now,currentYear,12,31), endClasses=countdown(now,2026,11,28);
 const dayOfYear=now?Math.floor((Date.UTC(Number(today?.slice(0,4)),Number(today?.slice(5,7))-1,Number(today?.slice(8,10)))-Date.UTC(Number(today?.slice(0,4)),0,1))/86400000)+1:null;
 const selectedPhrase=phrases[phraseIndex]??null;
 const mxName=now?compactDate(now):"Consultando fecha…";
 return <section className="fd-aura-home fd-aura-v75" aria-label="Aura Crono: reloj, clima, efemérides, frases y radio">
  <div className="fd-aura-top">
   <div className="fd-aura-intro"><span className="fd-aura-kicker"><Clock3 size={15}/> AURA CRONO · FACULTAD DE DERECHO</span><h2>Hoy en nuestra comunidad</h2><p>{mxName} · Ciudad de México</p><span className="fd-aura-day">Día {dayOfYear??"—"} del año</span></div>
   <div className="fd-aura-header-counts"><span><CalendarClock size={14}/> FIN DE CURSOS · 28 NOV 2026 <strong>{endClasses}</strong></span><span>FIN DE AÑO · 31 DIC {currentYear} <strong>{endYear}</strong></span></div>
   <SeasonalMascot month={month}/>
  </div>
  <div className="fd-aura-clock-grid fd-aura-four-grid">
   <AuraClockSelector time={time?{hour:time.hour??0,minute:time.minute??0,second:time.second??0}:null}/>
   <article className="fd-aura-panel fd-aura-today-weather">
    <div className="fd-aura-heading"><div><ThermometerSun size={19}/><h3>Fecha y clima</h3></div><button type="button" onClick={locate} disabled={locating} title="Usar ubicación con permiso"><LocateFixed size={15}/>{locating?"Buscando…":"Ubicarme"}</button></div>
    <strong className="fd-aura-today-date">{now?new Intl.DateTimeFormat("es-MX",{day:"numeric",month:"long",timeZone:timezone}).format(now):"—"}</strong><span className="fd-aura-yearline">{year} · Día {dayOfYear??"—"} del año</span>
    <p className="fd-aura-small"><MapPin size={13}/>{coords.name}</p>
    {weather?<><div className="fd-aura-current-weather"><span className="fd-aura-weather-symbol" aria-hidden="true">{[0,1].includes(weather.code)?"☀️":[2,3].includes(weather.code)?"⛅":[51,53,55,61,63,65,80,81,82].includes(weather.code)?"☔":weather.code>=95?"⛈️":"🌤️"}</span><strong>{Number.isFinite(weather.temperature)?Math.round(weather.temperature)+"°":"—"}</strong><span>{weather.label}</span></div><h4>Próximas horas</h4><div className="fd-aura-hourly">{weather.hourly.map((v,i)=><div key={i}><time>{v.time}</time><strong>{Math.round(v.temp)}°</strong><small>☂ {Math.round(v.rain)}%</small></div>)}</div></>:<p className="fd-aura-small" role="status">{weatherError||"Consultando Open-Meteo…"}</p>}
    <small className="fd-aura-credit">Fuente: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> · {coords.name}</small>
   </article>
   <article className="fd-aura-panel fd-aura-celebrations">
    <div className="fd-aura-heading"><div><History size={19}/><h3>Un día como hoy</h3></div><a href="https://es.wikipedia.org/wiki/Wikipedia:Efem%C3%A9rides" target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/></a></div>
    <span className="fd-aura-panel-kicker">CELEBRACIONES DEL DÍA</span>
    {holidays.length?<div className="fd-aura-holiday">{holidays.map((h,i)=><div key={i}><span className="fd-aura-holiday-symbol" aria-hidden="true">✦</span><strong>{h.name}</strong><p>{h.description}</p><small>{h.source}</small></div>)}</div>:<p className="fd-aura-small">{holidayStatus||"Consultando calendario y feed…"}</p>}
    <h4>También ocurrió hoy</h4>
    {history.length?<ol className="fd-aura-mini-events">{history.slice(0,3).map((h,i)=><li key={i}><b>{h.year}</b><a href={h.url.startsWith("https://es.wikipedia.org/")?h.url:"https://es.wikipedia.org/"} target="_blank" rel="noopener noreferrer">{h.text}</a></li>)}</ol>:<p className="fd-aura-small">{historyError||"Consultando efemérides de Wikipedia…"}</p>}
    <small className="fd-aura-credit">Wikipedia (feed) · Si falla, efeméride editorial identificada</small>
   </article>
   <article className="fd-aura-panel fd-aura-rotating-quote">
    <div className="fd-aura-heading"><div><Scale size={19}/><h3>Derecho en 10 segundos</h3></div><a href="/api/frases" target="_blank" rel="noopener noreferrer" title="Feed diario de frases">Feed ↗</a></div>
    <span className="fd-aura-panel-kicker">FRASE JURÍDICA DEL DÍA</span>
    <div className="fd-aura-quote-stage" aria-live="off" key={selectedPhrase?.id??"empty"}><span aria-hidden="true">“</span><blockquote>{selectedPhrase?.text??(phraseError?"No se pudo consultar el feed.":"Cargando frases jurídicas…")}</blockquote></div>
    <div className="fd-aura-quote-controls"><span>{selectedPhrase?phraseIndex+1:0} / {phrases.length||20} · Cambia cada 10 s</span><div className="fd-aura-quote-dots">{phrases.slice(0,20).map((p,i)=><button type="button" key={p.id} aria-label={"Frase "+(i+1)} aria-pressed={i===phraseIndex} onClick={()=>setPhraseIndex(i)}/>)}</div></div>
    <small className="fd-aura-credit">20 reflexiones del feed del portal; se seleccionan nuevas frases cada día, en horario de México.</small>
   </article>
  </div>
  <article className="fd-aura-panel fd-aura-radio fd-aura-radio-wide">
   <div className="fd-aura-heading"><div><Music2 size={20}/><h3>Radio para estudiar</h3></div><span className="fd-aura-onair"><RadioTower size={14}/> {stations.length} estaciones · sin reproducción automática</span></div>
   <div className="fd-aura-radio-row"><label htmlFor="fd-radio-station">Elige una emisora de música clásica, jazz o tu género favorito</label><select id="fd-radio-station" value={station} onChange={e=>{const next=Number(e.target.value);setStation(next);if(playing)startStation(next);else setRadioError("");}}>{AURA_STATION_GENRES.map(genre=><optgroup label={genre} key={genre}>{stations.map((s,i)=>s.genre===genre?<option key={s.id} value={i}>{s.name}</option>:null)}</optgroup>)}</select><div className="fd-aura-player"><button type="button" aria-label={playing?"Pausar radio":"Reproducir radio"} onClick={toggleRadio}>{playing?<Pause size={20}/>:<Play size={20}/>}</button><div><strong>{stations[station].name}</strong><small>{stations[station].genre} · {playing?"Reproduciendo":"Lista para escuchar"}</small></div></div></div>
   {radioError?<p className="fd-aura-small" role="status">{radioError}</p>:null}<audio ref={audio} preload="none" onError={radioFailure}/><small className="fd-aura-credit">Emisoras y enlaces adaptados del ZIP original de Aura Crono v3. Su disponibilidad depende de cada estación.</small>
  </article>
 </section>;
}
