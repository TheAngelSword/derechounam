import { AuraHome } from "@/components/aura-home";
import { PersonalHome } from "@/components/personal-home";
import { StudyBites } from "@/components/games/study-bites";
import { readShell } from "@/lib/personal/shell";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, CalendarDays, ClipboardCheck, GraduationCap, Headphones, Users } from "lucide-react";
import { Shell } from "@/components/shell";
import { NewsSection } from "@/components/news";
import { UpcomingEvents } from "@/components/home-dashboard";
import { useBoard, useBoardStatus } from "@/components/board-context";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
export const Route=createFileRoute("/")({loader:()=>readShell(),component:function Switch(){const site=Route.useLoaderData();return site.personal?<PersonalHome portalUrl={site.portalUrl}/>:<Home/>;}});
function Home(){const{user}=useCurrentUserState();return <Shell eyebrow="FACULTAD DE DERECHO · ALUMNOS · GRUPO 9114" title="Portal Facultad de Derecho ALUMNOS" lead="Tu espacio para estudiar y organizar el semestre, descubrir qué pasó hoy y seguir la actualidad jurídica.">
 <div className="fd-campus-shortcuts fd-campus-shortcuts-compact">{([{to:"/plan-estudios",label:"Plan de estudios",icon:GraduationCap},{to:"/clases",label:"Horarios",icon:CalendarDays},{to:"/catedras",label:"Cátedras",icon:Headphones},{to:"/tareas",label:"Tareas",icon:ClipboardCheck},{to:"/biblioteca",label:"Biblioteca",icon:BookOpen},{to:"/agenda",label:"Agenda",icon:CalendarDays}] as const).map(({to,label,icon:Icon})=><Link key={to} to={to}><Icon size={20} strokeWidth={1.7}/><strong>{label}</strong></Link>)}</div>
 <AuraHome/>
 <div className="fd-news-and-agenda"><div className="fd-home-news"><NewsSection/></div><UpcomingEvents/></div>
 <StudyBites/>
 <div className="fd-home-lower"><section className="fd-group-panel"><div className="fd-section-heading"><h2>Actividad de nuestra comunidad</h2><Users size={20}/></div>{user?<GroupActivity/>:<div className="fd-guest-message"><h3>Este espacio también es tuyo.</h3><p>Entra para participar en las cátedras y compartir materiales.</p><Link to="/login" search={{mode:"alta"}} className="fd-primary-button">Crear mi cuenta <ArrowUpRight size={16}/></Link></div>}</section></div>
 </Shell>;}
function GroupActivity(){const board=useBoard();const state=useBoardStatus();const items=[...board.materials.slice(0,2).map(m=>({id:`m${m.id}`,title:m.title,meta:m.courseName,to:"/catedras" as const})),...board.tasks.slice(0,2).map(t=>({id:`t${t.id}`,title:t.title,meta:`Entrega: ${t.dueDate}`,to:"/tareas" as const})),...board.notices.slice(0,1).map(n=>({id:`n${n.id}`,title:n.title,meta:"Mural del grupo",to:"/mural" as const}))];if(state.isError)return <p className="fd-alert">No se pudo consultar la actividad privada. Inicia sesión con un registro activo o vuelve a intentarlo.</p>;if(state.isFetching&&!items.length)return <p className="fd-muted">Consultando actividad…</p>;return items.length?<div className="fd-activity-list">{items.map(i=><Link to={i.to} key={i.id}><span><ClipboardCheck size={17}/></span><div><h3>{i.title}</h3><p>{i.meta}</p></div><ArrowUpRight size={16}/></Link>)}</div>:<div className="fd-empty"><BookOpen size={28}/><h3>Todavía no hay publicaciones</h3><p>Las tareas, apuntes y avisos aparecerán aquí cuando el grupo los comparta.</p></div>;}
