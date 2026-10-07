import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, CalendarDays, Camera, CarFront, ClipboardCheck, GraduationCap, Landmark, LayoutGrid, Megaphone, Menu, Shield, ShoppingBasket, SlidersHorizontal, Users, Vote, X, Search, Moon, Sun, PanelLeftClose, PanelLeftOpen, Newspaper, ArrowUpRight } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { PLAN_COURSES } from "@/lib/study/plan";
import { APP_VERSION } from "@/lib/app-version";
export const PORTAL_NAV=[
 {to:"/",label:"Inicio",icon:LayoutGrid,group:"Tu espacio"},{to:"/noticias",label:"Noticias",icon:Newspaper,group:"Tu espacio"},
 {to:"/plan-estudios",label:"Plan de estudios",icon:GraduationCap,group:"Academia"},{to:"/clases",label:"Horarios",icon:CalendarDays,group:"Academia"},{to:"/catedras",label:"Cátedras",icon:Landmark,group:"Academia"},{to:"/tareas",label:"Tareas",icon:ClipboardCheck,group:"Academia"},{to:"/biblioteca",label:"Biblioteca",icon:BookOpen,group:"Academia"},
 {to:"/agenda",label:"Agenda",icon:CalendarDays,group:"Comunidad"},{to:"/votaciones",label:"Votaciones",icon:Vote,group:"Comunidad"},{to:"/bitacora",label:"Bitácora",icon:Camera,group:"Comunidad"},{to:"/mesas",label:"Mesas de estudio",icon:Users,group:"Comunidad"},{to:"/mural",label:"Mural",icon:Megaphone,group:"Comunidad"},{to:"/servicios",label:"Servicios",icon:ShoppingBasket,group:"Comunidad"},{to:"/rutas",label:"Rutas",icon:CarFront,group:"Comunidad"},
 {to:"/registro",label:"Registro",icon:Shield,group:"Gestión"},{to:"/control",label:"Control",icon:SlidersHorizontal,group:"Gestión"},
] as const;
/** Keep the server and first browser render identical while the session store resolves. */
function SidebarAccount(){
 const [mounted,setMounted]=useState(false);
 useEffect(()=>setMounted(true),[]);
 return <div className="fd-sidebar-account" style={{minHeight:36}}>{mounted?<><SignedIn><UserButton/></SignedIn><SignedOut><Link to="/login" search={{mode:"entrar"}} className="fd-signin">Entrar a mi cuenta <ArrowUpRight size={16}/></Link></SignedOut></>:null}</div>;
}
export function Shell({eyebrow,title,lead,children}:{eyebrow:string;title:string;lead:string;children:ReactNode}){
 const pathname=useRouterState({select:s=>s.location.pathname}).replace(/\/+$/,"")||"/";
 const SectionIcon=PORTAL_NAV.find(n=>n.to===pathname)?.icon??Shield;
 const[menu,setMenu]=useState(false);const[collapsed,setCollapsed]=useState(false);const[dark,setDark]=useState(false);const[search,setSearch]=useState(false);const[q,setQ]=useState("");
 const dialog=useRef<HTMLDialogElement>(null);const searchInput=useRef<HTMLInputElement>(null);
 useEffect(()=>{try{setCollapsed(localStorage.getItem("fd-sidebar")==="compact");setDark(localStorage.getItem("fd-theme")==="dark");}catch{}},[]);
 useEffect(()=>{document.documentElement.dataset.theme=dark?"dark":"light";try{localStorage.setItem("fd-theme",dark?"dark":"light");}catch{}},[dark]);
 useEffect(()=>{const handle=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setSearch(s=>!s);}if(e.key==="Escape"){setSearch(false);setMenu(false);}};window.addEventListener("keydown",handle);return()=>window.removeEventListener("keydown",handle);},[]);
 useEffect(()=>{if(search){dialog.current?.showModal();searchInput.current?.focus();}else dialog.current?.close();},[search]);
 useEffect(()=>{setMenu(false);setSearch(false);},[pathname]);
 const term=q.toLocaleLowerCase("es").trim();const matches=PORTAL_NAV.filter(n=>n.label.toLocaleLowerCase("es").includes(term));
 const courses=term.length>2?PLAN_COURSES.filter(c=>`${c.code??""} ${c.name}`.toLocaleLowerCase("es").includes(term)).slice(0,6):[];
 function toggleCollapse(){setCollapsed(v=>{try{localStorage.setItem("fd-sidebar",v?"full":"compact");}catch{}return !v;});}
 return <div className={`fd-app fd-v72 ${pathname==="/"?"fd-home-page":""} ${collapsed?"is-compact":""}`}>
  <a className="fd-skip" href="#contenido">Saltar al contenido</a>
  {menu?<button className="fd-drawer-backdrop" onClick={()=>setMenu(false)} aria-label="Cerrar menú"/>:null}
  <aside className={`fd-sidebar ${menu?"is-open":""}`} aria-label="Barra lateral">
   <Link to="/" className="fd-brand"><span className="fd-monogram"><img src="/brand/justicia-emblema.webp" alt="" width="320" height="424"/></span><span className="fd-brand-copy">Facultad de<br/>Derecho<small>COMUNIDAD ACADÉMICA</small></span></Link>
   <div className="fd-cohort"><span className="fd-live-dot"/><span>Grupo <strong>9114</strong><small>Universidad Abierta · UNAM</small></span></div>
   <nav className="fd-navigation" aria-label="Navegación principal">{["Tu espacio","Academia","Comunidad","Gestión"].map(group=><div key={group}><p className="fd-nav-heading">{group}</p>{PORTAL_NAV.filter(n=>n.group===group).map(n=><Link to={n.to} key={n.to} title={collapsed?n.label:undefined} aria-current={pathname===n.to?"page":undefined} className={`fd-nav-link ${pathname===n.to?"active":""}`}><n.icon size={18} strokeWidth={1.6}/><span>{n.label}</span>{n.to==="/noticias"?<i className="fd-nav-new">NUEVO</i>:null}</Link>)}</div>)}</nav>
   <div className="fd-sidebar-bottom"><SidebarAccount/><p>Portal estudiantil independiente.<br/>No es un sitio oficial de la UNAM.</p></div>
  </aside>
  <div className="fd-workspace">
   <header className="fd-topbar"><div className="fd-topbar-start"><button className="fd-icon-button fd-mobile-toggle" onClick={()=>setMenu(!menu)} aria-label={menu?"Cerrar navegación":"Abrir navegación"} aria-expanded={menu}>{menu?<X size={20}/>:<Menu size={20}/>}</button><button className="fd-icon-button fd-desktop-toggle" onClick={toggleCollapse} aria-label={collapsed?"Expandir barra lateral":"Contraer barra lateral"}>{collapsed?<PanelLeftOpen size={19}/>:<PanelLeftClose size={19}/>}</button><span className="fd-breadcrumb">Mi campus <span>/</span> <strong>{PORTAL_NAV.find(n=>n.to===pathname)?.label??"Comunidad"}</strong></span></div><div className="fd-topbar-tools"><button className="fd-search-trigger" onClick={()=>setSearch(true)}><Search size={16}/><span>Buscar en el portal</span><kbd>Ctrl K</kbd></button><button className="fd-icon-button" onClick={()=>setDark(!dark)} aria-label={dark?"Activar tema claro":"Activar tema oscuro"}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button><span className="fd-avatar" title="Grupo 9114">FD</span></div></header>
   <main id="contenido" className="fd-main"><header className="fd-page-heading fd-page-heading-blue"><span className="fd-section-icon" aria-hidden="true"><SectionIcon size={42} strokeWidth={1.5}/></span><div className="fd-heading-copy"><p className="fd-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="fd-lead">{lead}</p>{pathname==="/"?<><p className="fd-heading-promise">Tu comunidad. Tu formación. Tu futuro en Derecho.</p><div className="fd-heading-actions"><Link to="/plan-estudios" className="fd-hero-button">Mi plan de estudios <ArrowUpRight size={17}/></Link><Link to="/noticias" className="fd-heading-secondary">Todas las noticias <ArrowUpRight size={17}/></Link></div></>:null}</div>{pathname==="/"||pathname==="/noticias"?<img className="fd-heading-justice" src="/brand/justicia-emblema.webp" alt="" width="320" height="424" aria-hidden="true"/>:null}</header>{children}</main>
   <footer className="fd-footer"><span>Facultad de Derecho <b>·</b> Comunidad 9114</span><span>Portal no oficial · v{APP_VERSION}</span></footer>
  </div>
  <dialog ref={dialog} onCancel={()=>setSearch(false)} onClick={e=>{if(e.target===e.currentTarget)setSearch(false);}} className="fd-search-dialog"><div className="fd-search-dialog-head"><Search size={20}/><input ref={searchInput} value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar secciones o materias…" aria-label="Buscar secciones o materias"/><button className="fd-icon-button" onClick={()=>setSearch(false)} aria-label="Cerrar búsqueda"><X size={18}/></button></div><div className="fd-search-results">{matches.map(n=><Link key={n.to} to={n.to} onClick={()=>setSearch(false)}><n.icon size={18}/><span>{n.label}</span><small>{n.group}</small></Link>)}{courses.map(c=><Link key={c.id} to="/plan-estudios" onClick={()=>setSearch(false)}><GraduationCap size={18}/><span>{c.name}</span><small>{c.semester?`Sem. ${c.semester}`:"Optativa"}</small></Link>)}{!matches.length&&!courses.length?<p className="fd-muted">Sin coincidencias. Prueba con una materia o sección.</p>:null}</div><p className="fd-search-tip">Esc para cerrar · Las materias se consultan en el plan completo.</p></dialog>
 </div>;
}
