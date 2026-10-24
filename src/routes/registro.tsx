import {createFileRoute} from '@tanstack/react-router';
import {useState,type FormEvent} from 'react';
import {Shell} from '@/components/shell';
import {Button,Card,Field,FormBox,Input,Pill,Select} from '@/components/ui';
import {useDirectory,useInvalidateDirectory} from '@/components/directory';
import {RegistryManager} from '@/components/registry-manager';
import {RegistryAccessLog} from '@/components/registry-access-log';
import {RedirectToSignIn} from '@/lib/auth/gates';
import {ChangePasswordForm} from '@/components/change-password';
import {useCurrentUserState} from '@/lib/auth/use-current-user';
import {AREAS,assignAreaMod,registerMember,revokeAreaMod,type Directory,type Member} from '@/lib/members';
import registryCss from '../styles-registry.css?url';
export const Route=createFileRoute('/registro')({head:()=>({links:[{rel:'stylesheet',href:registryCss}]}),component:RegistroPage});
function RegistroPage(){const {user,isPending}=useCurrentUserState();if(isPending)return <div className="grid min-h-dvh place-items-center bg-bg text-muted"><p>Comprobando acceso…</p></div>;if(!user)return <RedirectToSignIn/>;return <RegistroBody/>;}
function RegistroBody(){
 const {directory,isLoading,reload}=useDirectory(),invalidate=useInvalidateDirectory();const [error,setError]=useState(''),[pending,setPending]=useState(false);
 const me=directory?.me??null,isMod=me?.role==='moderador'&&me.status==='activo';
 async function onRegister(event:FormEvent<HTMLFormElement>){event.preventDefault();setError('');setPending(true);const data=new FormData(event.currentTarget);try{await registerMember({data:{alias:String(data.get('alias')??'')}});await invalidate();await reload();}catch(e){setError(e instanceof Error?e.message:'No se pudo solicitar acceso.');}finally{setPending(false);}}
 return <Shell eyebrow="Acceso del grupo 9114" title="Registro y comunidad." lead="Consulta el padrón. Los moderadores pueden revisar registros, gestionar permisos y descargar la bitácora de accesos."><div className="fd-registry">
 {isLoading?<p role="status">Cargando el padrón…</p>:<>
 {!me?<FormBox title="Alta en el padrón" onSubmit={onRegister}><Field label="Alias en clase"><Input name="alias" required minLength={2} maxLength={40} placeholder="Tu nombre o alias"/></Field><p className="fd-registry-help">Tu solicitud se registrará como alumno pendiente. Un moderador puede activarla y asignar el rol de profesor cuando corresponda.</p>{error?<p className="fd-registry-error" role="alert">{error}</p>:null}<Button type="submit" disabled={pending}>{pending?'Guardando…':'Solicitar acceso'}</Button></FormBox>:<Card className="fd-registry-profile"><div><Pill>{me.role}</Pill><h2>{me.alias}</h2><p>Grupo {me.groupCode} · {me.status}</p></div><span>{isMod?'Administración del padrón':'Mi registro'}</span></Card>}
 <Card><h2 id="clave" className="font-display text-xl">Cambiar contraseña</h2><p className="mt-2 mb-4 text-sm text-muted">Usa la clave actual de esta cuenta. Al guardarla se cierran las otras sesiones de este sitio.</p><ChangePasswordForm/></Card>
 {isMod&&me?<RegistryManager actorId={me.userId} onChange={invalidate}/>:<div className="fd-registry-public-rosters">{(['alumno','profesor','moderador'] as const).map((role,i)=><PublicRoster key={role} title={['Alumnos','Profesores','Moderadores'][i]} rows={directory?.members.filter(r=>r.role===role)??[]}/>)}</div>}
 {isMod&&me?<RegistryAccessLog actorId={me.userId}/>:<Card><h2 className="font-display text-xl">Privacidad del grupo</h2><p className="mt-2 text-sm text-muted">La bitácora detallada y las descargas de accesos están reservadas a moderadores activos.</p></Card>}
 <AreaAssignments directory={directory} isMod={isMod} onChange={invalidate}/>
 </>}
 </div></Shell>;
}
function PublicRoster({title,rows}:{title:string;rows:Member[]}){return <Card><h2 className="font-display text-xl">{title}</h2><p className="text-sm text-muted">{rows.length} en el padrón</p><ul className="fd-registry-public-list">{rows.map(r=><li key={r.userId}><span>{r.alias}</span><Pill>{r.status}</Pill></li>)}{!rows.length?<li>Sin registros visibles.</li>:null}</ul></Card>;}
function AreaAssignments({directory,isMod,onChange}:{directory:Directory|null;isMod:boolean;onChange:()=>Promise<unknown>}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function assign(event:FormEvent<HTMLFormElement>,area:(typeof AREAS)[number]['id']){event.preventDefault();const form=new FormData(event.currentTarget),userId=String(form.get('userId')??'');if(!userId)return;setBusy(true);setError('');try{await assignAreaMod({data:{userId,area}});await onChange();}catch(e){setError(e instanceof Error?e.message:'No se pudo asignar.');}finally{setBusy(false);}}
 async function revoke(userId:string,area:(typeof AREAS)[number]['id']){setBusy(true);setError('');try{await revokeAreaMod({data:{userId,area}});await onChange();}catch(e){setError(e instanceof Error?e.message:'No se pudo retirar.');}finally{setBusy(false);}}
 return <details className="fd-registry-card fd-registry-areas"><summary>Moderadores por área</summary>{error?<p className="fd-registry-error" role="alert">{error}</p>:null}<div className="fd-registry-area-grid">{AREAS.map(area=>{const assigned=directory?.mods.filter(m=>m.area===area.id)??[];return <section key={area.id}><h3>{area.label}</h3><p>{assigned.length?assigned.map(m=>m.alias).join(' · '):'Sin asignar'}</p>{isMod?<><form onSubmit={e=>void assign(e,area.id)}><Select name="userId" aria-label={'Asignar moderador de '+area.label} required><option value="">Elegir del padrón</option>{directory?.members.filter(m=>m.status==='activo').map(m=><option key={m.userId} value={m.userId}>{m.alias}</option>)}</Select><Button type="submit" variant="line" disabled={busy}>Asignar</Button></form>{assigned.map(m=><button className="fd-registry-link" type="button" disabled={busy} key={m.userId} onClick={()=>void revoke(m.userId,area.id)}>Retirar {m.alias}</button>)}</>:null}</section>;})}</div></details>;
}
