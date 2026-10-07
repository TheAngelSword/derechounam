import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, Clock3, MapPin, ChartNoAxesCombined, TrendingUp, GraduationCap } from "lucide-react";
import { CreditRing } from "./credit-ring";
import { useBoard, useBoardStatus } from "./board-context";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { loadStudyProgress } from "@/lib/study/functions";
import { summarizeProgress, COURSE_STATUS_LABELS } from "@/lib/study/progress";
import { loadPolls } from "@/lib/votaciones";
import { analyzeAvailability } from "@/lib/polls/analytics";
import { campusClock, nextCourse, upcomingEvents } from "@/lib/home-view";
function useClock(){const[now,setNow]=useState<number|null>(null);useEffect(()=>{setNow(Date.now());const id=setInterval(()=>setNow(Date.now()),60_000);return()=>clearInterval(id);},[]);return now;}
const showDate=(s:string)=>new Intl.DateTimeFormat("es-MX",{day:"numeric",month:"short",timeZone:"UTC"}).format(new Date(`${s}T12:00:00Z`));
export function HomeDashboard(){
 const{user}=useCurrentUserState();const board=useBoard();const state=useBoardStatus();const now=useClock();
 const progress=useQuery({queryKey:["study-progress",user?.id],queryFn:()=>loadStudyProgress(),enabled:!!user,retry:1});
 const polls=useQuery({queryKey:["home-polls-v72",user?.id],queryFn:()=>loadPolls(),staleTime:30_000,retry:1});
 const summary=summarizeProgress(progress.data?.progress??{});const next=now?nextCourse(board.courses,now):null;
 const active=polls.data?.filter(p=>p.isOpen&&(!p.scheduledDate||!now||p.scheduledDate>=campusClock(now).date)).sort((a,b)=>(b.updatedAt??"").localeCompare(a.updatedAt??""))[0];
 const stats=active&&now?analyzeAvailability(active.responses,campusClock(now).date):null;
 const bars=stats?.days.filter(d=>d.count>0).sort((a,b)=>b.count-a.count).slice(0,5)??[];
 const lead=stats?.leaders[0];const trend=stats?stats.leaders.length>1?"Hay un empate entre propuestas":lead?`${showDate(lead.date)} · ${lead.time}`:stats.leadingDays.length?`Días más mencionados: ${stats.leadingDays.map(d=>d.label).join(", ")}`:"Aún no hay una preferencia definida":"";
 return <section className="fd-dashboard-row" aria-label="Tu actividad académica">
  <article className="fd-dashboard-card"><div className="fd-card-heading"><h2>Mi avance académico</h2><Link to="/plan-estudios">Ver plan <ArrowUpRight size={14}/></Link></div>
   {!user?<div className="fd-dashboard-empty"><GraduationCap size={34}/><h3>Tu carrera, a tu ritmo.</h3><p>Inicia sesión para consultar y guardar tu avance personal.</p><Link to="/login" search={{mode:"entrar"}}>Entrar a mi cuenta</Link></div>:progress.isError?<p role="status">No se pudo consultar tu avance. <button onClick={()=>void progress.refetch()}>Reintentar</button></p>:progress.isPending?<p role="status">Consultando tu avance…</p>:<><div className="fd-dashboard-progress"><CreditRing credits={summary.credits}/><div className="fd-progress-legend">{(["aprobada","cursando","reprobada","pendiente"] as const).map(s=><div key={s}><i className={`status-${s}`}/><span>{COURSE_STATUS_LABELS[s]}</span><b>{summary.counts[s]}</b></div>)}</div></div><div className="fd-credit-total"><span>Créditos aprobados<strong>{summary.credits} <small>/ 450</small></strong></span><span>Materias aprobadas<strong>{summary.passed}</strong></span></div><p className="fd-dashboard-note">Registro personal, no historial oficial. No presentadas y bajas: consulta el plan.</p></>}
  </article>
  <article className="fd-dashboard-card"><div className="fd-card-heading"><h2>Próxima clase</h2><Link to="/clases">Ver horarios <ArrowUpRight size={14}/></Link></div>
   {state.isError?<p>No se pudo consultar el horario.</p>:next?<><div className="fd-next-class"><div className="fd-calendar-tile"><small>{next.course.weekday}</small><b>{next.date.slice(-2)}</b><span>{showDate(next.date).split(" ").slice(1).join(" ")}</span></div><div><h3>{next.course.name}</h3><p><Clock3 size={15}/>{next.course.timeSlot}</p><p><MapPin size={15}/>{next.course.place||"Lugar por confirmar"}</p><p>{next.course.chair}</p></div></div><Link to="/clases" className="fd-detail-button">Ver detalles <ArrowUpRight size={15}/></Link><p className="fd-dashboard-note">Según el horario semanal del grupo. Confirma la vigencia y las suspensiones en el calendario.</p></>:<div className="fd-dashboard-empty"><CalendarDays size={32}/><h3>{user?"Consulta tu horario":"Organiza tu semana"}</h3><p>{state.isFetching?"Cargando las materias del grupo…":"No hay una próxima sesión identificable en el horario disponible."}</p><Link to="/clases">Abrir horarios</Link></div>}
  </article>
  <article className="fd-dashboard-card"><div className="fd-card-heading"><h2><ChartNoAxesCombined size={19}/> Votación activa</h2><Link to="/votaciones">Ver todas <ArrowUpRight size={14}/></Link></div>
   {polls.isError?<p>No se pudieron consultar las votaciones.</p>:active&&stats?<><h3 className="fd-active-poll-title">{active.title}</h3><span className="fd-open-badge">Abierta · {stats.total} respuestas</span><div className="fd-mini-bars">{bars.map(d=><div key={d.day}><span>{d.label}</span><i><b style={{width:`${stats.total?d.count/stats.total*100:0}%`}}/></i><strong>{d.count}</strong></div>)}</div><p className="fd-home-trend"><TrendingUp size={18}/><span>{lead?"Se perfila hacia: ":""}{trend}</span></p><p className="fd-dashboard-note">{stats.flexible} personas se adaptan. Se muestran menciones por día; una persona puede marcar varios. La orientación no cierra la votación.</p></>:<div className="fd-dashboard-empty"><ChartNoAxesCombined size={32}/><h3>{polls.isPending?"Consultando votaciones…":"Sin votaciones abiertas"}</h3><p>Las opciones y su tendencia aparecerán cuando el grupo participe.</p><Link to="/votaciones">Abrir votaciones</Link></div>}
  </article>
 </section>;
}
export function UpcomingEvents(){const board=useBoard();const state=useBoardStatus();const now=useClock();const events=now?upcomingEvents(board.events,campusClock(now).date):[];return <section className="fd-dashboard-card fd-upcoming"><div className="fd-card-heading"><h2>Próximos eventos</h2><Link to="/agenda">Ver agenda <ArrowUpRight size={14}/></Link></div>{events.length?<div className="fd-event-list">{events.map(e=><Link key={e.id} to="/agenda"><CalendarDays size={22}/><div><h3>{e.title}</h3><p>{showDate(e.eventDate)} · {e.timeSlot}</p><p>{e.place||e.modality}</p></div><ArrowUpRight size={14}/></Link>)}</div>:<div className="fd-dashboard-empty"><CalendarDays size={30}/><h3>{state.isFetching?"Consultando la agenda…":"La agenda está abierta"}</h3><p>{state.isError?"No fue posible consultar las actividades.":"No hay próximos eventos en la información disponible. Consulta la agenda o publica una actividad."}</p><Link to="/agenda">Abrir agenda</Link></div>}</section>;}
