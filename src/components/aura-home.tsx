import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, MapPin, Music2, Play, Pause, RefreshCw, History, ThermometerSun, CalendarClock, ExternalLink, LocateFixed, RadioTower, Scale, BookOpenText } from "lucide-react";

type Weather={temperature:number;code:number;label:string;days:{date:string;min:number;max:number;code:number}[]};
type HistoryEvent={year:number;text:string;url:string};
type Phrase={id:string;text:string};
const timezone="America/Mexico_City";
const compactDate=(date:Date)=>new Intl.DateTimeFormat("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:timezone}).format(date);
const cityDate=(date:Date)=>new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"2-digit",day:"2-digit",timeZone:timezone}).format(date);
const dateNumbers=(date:Date)=>Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:timezone,hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date).map(p=>[p.type,Number(p.value)]));
const pad=(value:number)=>String(value).padStart(2,"0");
const WEATHER_LABELS:Record<number,string>={0:"Despejado",1:"Mayormente despejado",2:"Parcialmente nublado",3:"Nublado",45:"Niebla",48:"Niebla",51:"Llovizna",53:"Llovizna",55:"Llovizna",61:"Lluvia",63:"Lluvia",65:"Lluvia intensa",71:"Nieve",73:"Nieve",75:"Nieve",80:"Chubascos",81:"Chubascos",82:"Lluvia intensa",95:"Tormenta",96:"Tormenta",99:"Tormenta"};
const stations=[
 {name:"Radio Swiss Classic",genre:"Música clásica",urls:["https://stream.srg-ssr.ch/m/rsc_de/mp3_128"]},
 {name:"FIP Jazz",genre:"Jazz",urls:["https://icecast.radiofrance.fr/fipjazz-midfi.mp3","https://icecast.radiofrance.fr/fipjazz-hifi.aac"]},
 {name:"Radio Swiss Jazz",genre:"Jazz",urls:["https://stream.srg-ssr.ch/m/rsj/mp3_128"]},
 {name:"SomaFM Sonic Universe",genre:"Jazz contemporáneo",urls:["https://ice5.somafm.com/sonicuniverse-128-mp3","https://ice2.somafm.com/sonicuniverse-128-mp3"]},
 {name:"SomaFM Bossa Beyond",genre:"Bossa / lounge",urls:["https://ice5.somafm.com/bossa-128-mp3","https://ice2.somafm.com/bossa-128-mp3"]}
];
function countdown(now:Date|null,year:number,month:number,day:number){
 if(!now)return "—";
 const remaining=Date.UTC(year,month-1,day+1,6)-now.getTime();
 if(remaining<=0)return "Finalizado";
 const days=Math.floor(remaining/86400000),hours=Math.floor(remaining%86400000/3600000),minutes=Math.floor(remaining%3600000/60000);
 return days+" d · "+pad(hours)+" h · "+pad(minutes)+" min";
}
function SeasonalMascot({month}:{month:number}){
 const phase=month===12?{label:"Cierre de año",emoji:"❄️",theme:"winter"}:month===11?{label:"Recta final del semestre",emoji:"🍂",theme:"autumn"}:month===10?{label:"Otoño jurídico",emoji:"🍁",theme:"autumn"}:month<=3?{label:"Nuevo ciclo",emoji:"🌱",theme:"spring"}:month<=6?{label:"Temporada de estudio",emoji:"🌼",theme:"spring"}:{label:"Cultura universitaria",emoji:"☀️",theme:"summer"};
 return <div className={"fd-aura-mascot "+phase.theme} aria-label={"Búho universitario animado. "+phase.label}>
 <span className="fd-aura-spark left">{phase.emoji}</span><span className="fd-aura-owl" role="img" aria-label="Búho con birrete">🦉</span><span className="fd-aura-cap" aria-hidden="true">🎓</span><span className="fd-aura-book" aria-hidden="true">📖</span><span className="fd-aura-spark right">{phase.emoji}</span><small>{phase.label}</small>
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
 const[station,setStation]=useState(0),[playing,setPlaying]=useState(false),[radioError,setRadioError]=useState(""),[sourceIndex,setSourceIndex]=useState(0);
 const audio=useRef<HTMLAudioElement>(null);
 useEffect(()=>{const tick=()=>setNow(new Date());tick();const t=setInterval(tick,1000);return()=>clearInterval(t)},[]);
 const today=now?cityDate(now):null;
 const time=now?dateNumbers(now):null;
 const month=now?Number(today?.split("-")[1]):10,year=now?Number(today?.slice(0,4)):2026;
 useEffect(()=>{if(!today)return;let active=true;
  const parts=today.split("-");const url="https://es.wikipedia.org/api/rest_v1/feed/onthisday/events/"+parts[1]+"/"+parts[2];
  setHistory([]);setHistoryError("");
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
  const base="https://api.open-meteo.com/v1/forecast?latitude="+coords.lat+"&longitude="+coords.lon+"&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5";
  fetch(base).then(r=>{if(!r.ok)throw Error("Sin datos meteorológicos");return r.json()}).then(d=>{if(!active)return;const daily=d.daily??{};setWeather({temperature:Number(d.current?.temperature_2m),code:Number(d.current?.weather_code),label:WEATHER_LABELS[Number(d.current?.weather_code)]??"Variable",days:(daily.time??[]).slice(0,5).map((date:string,i:number)=>({date,min:Number(daily.temperature_2m_min[i]),max:Number(daily.temperature_2m_max[i]),code:Number(daily.weather_code[i])}))});}).catch(()=>{if(active)setWeatherError("Clima no disponible en este momento.")});
  return()=>{active=false};
 },[coords.lat,coords.lon]);
 function locate(){if(!navigator.geolocation){setWeatherError("Tu navegador no permite geolocalización.");return}setLocating(true);navigator.geolocation.getCurrentPosition(p=>{setCoords({lat:Number(p.coords.latitude.toFixed(3)),lon:Number(p.coords.longitude.toFixed(3)),name:"Tu ubicación aproximada"});setLocating(false);},()=>{setLocating(false);setWeatherError("Ubicación no autorizada. Se muestra el clima de referencia de Ciudad de México.")},{timeout:10000,maximumAge:600000});}
 function startStation(index=station,alternate=0){const a=audio.current;if(!a)return;setStation(index);setSourceIndex(alternate);setRadioError("");a.src=stations[index].urls[alternate];a.volume=0.6;a.play().then(()=>setPlaying(true)).catch(()=>{setPlaying(false);setRadioError("El navegador o la emisora impidió la reproducción. Prueba otra estación.")});}
 function toggleRadio(){if(!audio.current)return;if(playing){audio.current.pause();setPlaying(false)}else startStation()}
 function radioFailure(){const next=sourceIndex+1;if(next<stations[station].urls.length){startStation(station,next)}else{setPlaying(false);setRadioError("Emisora temporalmente no disponible. Selecciona otra.")}}
 const currentYear=year||2026, newYearTarget=Date.UTC(currentYear+1,0,1,6), endYear=countdown(now,currentYear,12,31), endClasses=countdown(now,2026,11,28);
 const dayOfYear=now?Math.floor((Date.UTC(Number(today?.slice(0,4)),Number(today?.slice(5,7))-1,Number(today?.slice(8,10)))-Date.UTC(Number(today?.slice(0,4)),0,1))/86400000)+1:null;
 return <section className="fd-aura-home" aria-label="Aura Crono integrado al inicio">
  <div className="fd-aura-top">
   <div className="fd-aura-intro"><span className="fd-aura-kicker"><Clock3 size={15}/> AURA CRONO · EN TU PORTAL</span><h2>Hoy en nuestra comunidad</h2><p>{now?compactDate(now):"Consultando la fecha local…"} · {timezone.replace("_"," ")}</p><span className="fd-aura-day">Día {dayOfYear??"—"} del año</span></div>
   <SeasonalMascot month={month}/>
  </div>
  <div className="fd-aura-clock-grid">
   <article className="fd-aura-time-card"><span>ATELIER · ANALÓGICO</span><MiniAnalog time={time}/><strong>Hora de México</strong></article>
   <article className="fd-aura-time-card"><span>CRISTAL · DIGITAL</span><div className="fd-aura-digital">{time?pad(time.hour)+":"+pad(time.minute)+":"+pad(time.second):"--:--:--"}</div><strong>Formato 24 horas</strong></article>
   <article className="fd-aura-time-card"><span>ÓRBITA TEMPORAL</span><MiniOrbit time={time}/><strong>Horas y minutos</strong></article>
   <article className="fd-aura-deadlines"><span><CalendarClock size={15}/> CONTADORES</span><div><small>Fin de cursos · 28 nov 2026</small><strong>{endClasses}</strong></div><div><small>Fin de año · 31 dic {currentYear}</small><strong>{endYear}</strong></div></article>
  </div>
  <div className="fd-aura-services">
   <article className="fd-aura-panel fd-aura-weather"><div className="fd-aura-heading"><div><ThermometerSun size={20}/><h3>Clima y pronóstico</h3></div><button type="button" onClick={locate} disabled={locating} title="Solicitar permiso para tu ubicación"><LocateFixed size={16}/>{locating?"Buscando…":"Mi ubicación"}</button></div><p className="fd-aura-small"><MapPin size={13}/>{coords.name}</p>{weather?<><strong className="fd-aura-temperature">{Number.isFinite(weather.temperature)?Math.round(weather.temperature)+" °C":"—"} <small>{weather.label}</small></strong><div className="fd-aura-forecast">{weather.days.map(d=><div key={d.date}><span>{new Intl.DateTimeFormat("es-MX",{weekday:"short",timeZone:"UTC"}).format(new Date(d.date+"T12:00:00Z"))}</span><strong>{Math.round(d.max)}°</strong><small>{Math.round(d.min)}°</small></div>)}</div></>:<p role="status">{weatherError||"Consultando Open-Meteo…"}</p>}<small className="fd-aura-credit">Fuente: <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo</a> · Coordenadas no guardadas</small></article>
   <article className="fd-aura-panel fd-aura-radio"><div className="fd-aura-heading"><div><Music2 size={20}/><h3>Radio para estudiar</h3></div><span className="fd-aura-onair"><RadioTower size={14}/> En línea</span></div><label htmlFor="fd-radio-station">Clásica, jazz y música tranquila</label><select id="fd-radio-station" value={station} onChange={e=>{const next=Number(e.target.value);setStation(next);if(playing)startStation(next);else setRadioError("")}}>{stations.map((s,i)=><option key={s.name} value={i}>{s.name} · {s.genre}</option>)}</select><div className="fd-aura-player"><button type="button" aria-label={playing?"Pausar estación":"Reproducir estación"} onClick={toggleRadio}>{playing?<Pause size={20}/>:<Play size={20}/>}</button><div><strong>{stations[station].name}</strong><small>{stations[station].genre} · {playing?"Reproduciendo":"Pulsa para escuchar"}</small></div></div>{radioError?<small role="status">{radioError}</small>:null}<audio ref={audio} preload="none" onError={radioFailure}/><small className="fd-aura-credit">La reproducción depende de las emisoras externas. No inicia automáticamente.</small></article>
  </div>
  <div className="fd-aura-services fd-aura-lower">
   <article className="fd-aura-panel fd-aura-history"><div className="fd-aura-heading"><div><History size={19}/><h3>Un día como hoy</h3></div><a href="https://es.wikipedia.org/wiki/Wikipedia:Efem%C3%A9rides" target="_blank" rel="noopener noreferrer" aria-label="Consultar Wikipedia"><ExternalLink size={16}/></a></div>{history.length?<ol>{history.map((e,i)=><li key={e.year+"-"+i}><b>{e.year}</b><a href={e.url.startsWith("https://es.wikipedia.org/")?e.url:"https://es.wikipedia.org/"} target="_blank" rel="noopener noreferrer">{e.text}</a></li>)}</ol>:<p className="fd-aura-small" role="status">{historyError||"Consultando los acontecimientos de esta fecha…"}</p>}<small className="fd-aura-credit">Acontecimientos del feed de Wikipedia · Consulta el artículo para verificar los detalles</small></article>
   <article className="fd-aura-panel fd-aura-phrases"><div className="fd-aura-heading"><div><Scale size={20}/><h3>20 frases para pensar el Derecho</h3></div><a href="/api/frases" target="_blank" rel="noopener noreferrer" title="Feed jurídico del portal">Feed diario ↗</a></div><p className="fd-aura-small">Cápsulas jurídicas originales que se renuevan cada día, hora de México.</p><div className="fd-aura-marquee" aria-label="Veinte frases jurídicas del día"><div className="fd-aura-marquee-track">{phrases.length?phrases.map((f,i)=><span key={f.id}><BookOpenText size={15}/>{i+1}. {f.text}</span>):<span>{phraseError?"No se pudo cargar el feed de frases.":"Cargando frases del día…"}</span>}</div></div><a className="fd-aura-credit" href="/api/frases" target="_blank" rel="noopener noreferrer">Ver las 20 frases de hoy en el feed del portal ↗</a></article>
  </div>
 </section>;
}
