import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth/middleware';
import { getSql } from '@/lib/db';
import { ACCESS_SECTIONS,asISO,type Member,type AdminMember,type AccessEntry,type AccessReport,type UsageRow } from './registry-model';
export type {Member,AccessEntry} from './registry-model';
export const AREAS=[{id:'clases',label:'Horarios'},{id:'catedras',label:'Cátedras'},{id:'agenda',label:'Agenda'},{id:'biblioteca',label:'Biblioteca'},{id:'rutas',label:'Rutas'},{id:'mesas',label:'Mesas'},{id:'mural',label:'Mural'},{id:'bitacora',label:'Bitácora'},{id:'servicios',label:'Servicios'},{id:'tareas',label:'Tareas'}] as const;
export type AreaId=(typeof AREAS)[number]['id'];
export type AreaMod={userId:string;alias:string;area:string};
export type Directory={me:Member|null;members:Member[];mods:AreaMod[];access:AccessEntry[]};
const roles=z.enum(['alumno','profesor','moderador']);
const statuses=z.enum(['pendiente','activo','suspendido']);
const areaSchema=z.enum(['clases','catedras','agenda','biblioteca','rutas','mesas','mural','bitacora','servicios','tareas']);
const userId=z.string().min(1).max(200);
const revision=z.number().int().positive();
type MemberRow={user_id:string;alias:string;role:Member['role'];group_code:string;status:Member['status'];created_at:unknown;revision:number;updated_at?:unknown};
const mapMember=(r:MemberRow):Member=>({userId:r.user_id,alias:r.alias,role:r.role,groupCode:r.group_code,status:r.status,createdAt:asISO(r.created_at),revision:r.revision});
async function loadMember(id:string):Promise<Member|null>{const sql=await getSql();const rows=await sql<MemberRow>`select * from members where user_id=${id} limit 1`;return rows[0]?mapMember(rows[0]):null;}
async function requireModerator(id:string){const me=await loadMember(id);if(!me||me.role!=='moderador'||me.status!=='activo')throw new Error('Solo un moderador activo puede consultar o administrar estos datos');return me;}
async function privateResponse(){const {setResponseHeader}=await import('@tanstack/react-start/server');setResponseHeader('Cache-Control','private, no-store');}

export const loadDirectory=createServerFn({method:'GET'}).middleware([authMiddleware]).handler(async({context}):Promise<Directory>=>{
 await privateResponse();const me=await loadMember(context.userId);
 if(!me||me.status!=='activo')return {me,members:[],mods:[],access:[]};
 const sql=await getSql();const [members,mods]=await Promise.all([
  sql<MemberRow>`select * from members order by role,alias`,
  sql<{user_id:string;alias:string;area:string}>`select a.user_id,m.alias,a.area from area_mods a join members m on m.user_id=a.user_id where m.status='activo' order by a.area,m.alias`
 ]);
 // Detailed access logs and email addresses are only served by moderator endpoints.
 return {me,members:members.map(mapMember),mods:mods.map(r=>({userId:r.user_id,alias:r.alias,area:r.area})),access:[]};
});
export const registerMember=createServerFn({method:'POST'}).middleware([authMiddleware]).validator(z.object({alias:z.string().trim().min(2).max(40),role:z.enum(['alumno','profesor']).optional()})).handler(async({context,data}):Promise<Member>=>{
 const existing=await loadMember(context.userId);if(existing)return existing;
 const sql=await getSql();const rows=await sql<{n:number}>`select count(*)::int as n from members`;
 const first=rows[0]?.n===0;
 await sql`insert into members(user_id,alias,role,group_code,status) values(${context.userId},${data.alias},${first?'moderador':'alumno'},'9114',${first?'activo':'pendiente'}) on conflict(user_id) do nothing`;
 const created=await loadMember(context.userId);if(!created)throw new Error('No se pudo registrar');return created;
});
async function changeMember(actor:string,target:string,changes:Record<string,unknown>,expected:number|null=null,operation='editar'){
 await requireModerator(actor);const sql=await getSql();
 // The database function locks and rechecks the actor, target, revision and last moderator atomically.
 await sql`select portal_manage_member(${actor},${target},${operation},${expected},${JSON.stringify(changes)}::jsonb)`;
 return {ok:true as const};
}
export const setMemberStatus=createServerFn({method:'POST'}).middleware([authMiddleware]).validator(z.object({userId,status:statuses})).handler(({context,data})=>changeMember(context.userId,data.userId,{status:data.status}));
export const setMemberRole=createServerFn({method:'POST'}).middleware([authMiddleware]).validator(z.object({userId,role:roles})).handler(({context,data})=>changeMember(context.userId,data.userId,{role:data.role}));
export const updateRegistryMember=createServerFn({method:'POST'}).middleware([authMiddleware]).validator(z.object({userId,revision,alias:z.string().trim().min(2).max(80),groupCode:z.string().trim().min(1).max(30),role:roles,status:statuses})).handler(({context,data})=>changeMember(context.userId,data.userId,{alias:data.alias,groupCode:data.groupCode,role:data.role,status:data.status},data.revision));
export const deleteRegistryMember=createServerFn({method:'POST'}).middleware([authMiddleware]).validator(z.object({userId,revision,confirmation:z.literal('ELIMINAR')})).handler(({context,data})=>changeMember(context.userId,data.userId,{},data.revision,'eliminar'));
export const loadAdminMembers=createServerFn({method:'GET'}).middleware([authMiddleware]).handler(async({context}):Promise<AdminMember[]>=>{
 await privateResponse();await requireModerator(context.userId);const sql=await getSql();
 const rows=await sql<MemberRow&{email:string|null;account_name:string|null}>`select m.*,u.email,u.name as account_name from members m left join "user" u on u.id=m.user_id order by lower(m.alias),m.user_id`;
 return rows.map(r=>({...mapMember(r),email:r.email,accountName:r.account_name,revision:r.revision,updatedAt:asISO(r.updated_at)}));
});
export const assignAreaMod=createServerFn({method:'POST'}).middleware([authMiddleware]).validator(z.object({userId,area:areaSchema})).handler(async({context,data})=>{
 await requireModerator(context.userId);const sql=await getSql();const rows=await sql<{user_id:string}>`insert into area_mods(user_id,area) select user_id,${data.area} from members where user_id=${data.userId} and status='activo' on conflict(user_id,area) do update set area=excluded.area returning user_id`;
 if(!rows.length)throw new Error('Solo se pueden asignar áreas a un registro activo');return {ok:true as const};
});
export const revokeAreaMod=createServerFn({method:'POST'}).middleware([authMiddleware]).validator(z.object({userId,area:areaSchema})).handler(async({context,data})=>{await requireModerator(context.userId);const sql=await getSql();await sql`delete from area_mods where user_id=${data.userId} and area=${data.area}`;return {ok:true as const};});
export const logAccess=createServerFn({method:'POST'}).middleware([authMiddleware]).validator(z.object({area:z.string().refine(v=>ACCESS_SECTIONS.some(s=>s.id===v),'Sección no válida'),action:z.enum(['entrada','publicar']),eventId:z.string().min(8).max(100).optional()})).handler(async({context,data})=>{
 const { requestIsPersonal } = await import("@/lib/personal/request.server");
 if (requestIsPersonal()) return { ok: false as const };
 const me=await loadMember(context.userId);if(!me||me.status!=='activo')return {ok:false as const};const sql=await getSql();
 await sql`insert into access_log(user_id,alias,area,action,event_id) values(${context.userId},${me.alias},${data.area},${data.action},${data.eventId??null}) on conflict(event_id) do nothing`;
 return {ok:true as const};
});
const dateInput=z.string().refine(v=>!v||(/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v),'Fecha no válida');
const filterSchema=z.object({from:dateInput.default(''),until:dateInput.default(''),userId:z.string().max(200).default(''),area:z.string().max(60).default(''),action:z.enum(['','entrada','publicar']).default(''),offset:z.number().int().min(0).max(1000000).default(0),snapshotId:z.number().int().min(0).optional(),exportAll:z.boolean().default(false)}).refine(v=>!v.from||!v.until||v.from<=v.until,'El inicio no puede ser posterior al fin');
export const loadAccessReport=createServerFn({method:'GET'}).middleware([authMiddleware]).validator(filterSchema).handler(async({context,data}):Promise<AccessReport>=>{
 await privateResponse();await requireModerator(context.userId);const sql=await getSql();
 const ceiling=data.snapshotId??Number((await sql<{id:number}>`select coalesce(max(id),0) as id from access_log`)[0]?.id??0);
 const filters={from:data.from,until:data.until,userId:data.userId,area:data.area,action:data.action};
 const args:unknown[]=[data.from,data.until,data.userId,data.area,data.action,ceiling];
 const where=`where ($1::text='' or l.created_at >= (nullif($1,'')::date::timestamp at time zone 'America/Mexico_City')) and ($2::text='' or l.created_at < ((nullif($2,'')::date+1)::timestamp at time zone 'America/Mexico_City')) and ($3::text='' or l.user_id=$3) and ($4::text='' or l.area=$4) and ($5::text='' or l.action=$5) and l.id <= $6`;
 const join=`from access_log l left join members m on m.user_id=l.user_id left join "user" u on u.id=l.user_id`;
 const totals=await sql.query<{total:number;users:number;sections:number}>(`select count(*)::int total,count(distinct l.user_id)::int users,count(distinct l.area)::int sections from access_log l ${where}`,args);
 const counts=totals[0]??{total:0,users:0,sections:0};
 if(data.exportAll&&counts.total>10000)throw new Error('El filtro contiene más de 10,000 accesos. Acota las fechas o selecciona un usuario para descargar el Excel completo, sin recortes.');
 const limit=data.exportAll?10001:50;
 const [rows,summary]=await Promise.all([
  sql.query<{id:number;user_id:string;alias:string;current_alias:string;email:string|null;area:string;action:string;created_at:unknown}>(`select l.id,l.user_id,l.alias,coalesce(m.alias,l.alias) current_alias,u.email,l.area,l.action,l.created_at ${join} ${where} order by l.created_at desc,l.id desc limit $7 offset $8`,[...args,limit,data.exportAll?0:data.offset]),
  sql.query<{user_id:string;alias:string;email:string|null;area:string;entries:number;publications:number;events:number;first_at:unknown;last_at:unknown}>(`select l.user_id,coalesce(m.alias,max(l.alias)) alias,u.email,l.area,count(*) filter(where l.action='entrada')::int entries,count(*) filter(where l.action='publicar')::int publications,count(*)::int events,min(l.created_at) first_at,max(l.created_at) last_at ${join} ${where} group by l.user_id,m.alias,u.email,l.area order by events desc,l.user_id,l.area`,args)
 ]);
 if(data.exportAll&&rows.length>10000)throw new Error('Acota los filtros antes de exportar más de 10,000 accesos.');
 const usage:UsageRow[]=summary.map(r=>({userId:r.user_id,alias:r.alias,email:r.email,area:r.area,entries:r.entries,publications:r.publications,events:r.events,firstAt:asISO(r.first_at),lastAt:asISO(r.last_at)}));
 return {rows:rows.map(r=>({id:r.id,userId:r.user_id,alias:r.alias,currentAlias:r.current_alias,email:r.email,area:r.area,action:r.action,createdAt:asISO(r.created_at)})),usage,total:counts.total,users:counts.users,sections:counts.sections,snapshotId:ceiling,generatedAt:new Date().toISOString(),filters};
});
