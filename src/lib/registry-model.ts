export const ACCESS_SECTIONS=[
 {id:'inicio',label:'Inicio'},{id:'noticias',label:'Noticias'},{id:'juegos',label:'Juegos'},
 {id:'plan-estudios',label:'Plan de estudios'},{id:'clases',label:'Horarios'},
 {id:'catedras',label:'Cátedras'},{id:'tareas',label:'Tareas'},{id:'biblioteca',label:'Biblioteca'},
 {id:'agenda',label:'Agenda'},{id:'votaciones',label:'Votaciones'},{id:'bitacora',label:'Bitácora'},
 {id:'mesas',label:'Mesas de estudio'},{id:'mural',label:'Mural'},{id:'servicios',label:'Servicios'},
 {id:'rutas',label:'Rutas'},{id:'registro',label:'Registro'},{id:'control',label:'Control'}
] as const;
export type AccessArea=(typeof ACCESS_SECTIONS)[number]['id'];
export type RegistryRole='alumno'|'profesor'|'moderador';
export type RegistryStatus='pendiente'|'activo'|'suspendido';
export type Member={userId:string;alias:string;role:RegistryRole;groupCode:string;status:RegistryStatus;createdAt:string;revision?:number};
export type AdminMember=Member&{email:string|null;accountName:string|null;revision:number;updatedAt:string};
export type AccessEntry={id:number;userId:string;alias:string;currentAlias?:string;email?:string|null;area:string;action:string;createdAt:string};
export type AccessFilters={from:string;until:string;userId:string;area:string;action:string};
export type UsageRow={userId:string;alias:string;email:string|null;area:string;entries:number;publications:number;events:number;firstAt:string;lastAt:string};
export type AccessReport={rows:AccessEntry[];usage:UsageRow[];total:number;users:number;sections:number;snapshotId:number;generatedAt:string;filters:AccessFilters};
export function sectionName(id:string){return ACCESS_SECTIONS.find(s=>s.id===id)?.label??id;}
export function asISO(value:unknown){const d=value instanceof Date?value:new Date(String(value));return Number.isFinite(d.getTime())?d.toISOString():'';}
export function accessDate(value:string){const d=new Date(value);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('es-MX',{timeZone:'America/Mexico_City',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(d):'Sin fecha válida';}
export function mexicoDate(date=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);return ['year','month','day'].map(t=>p.find(v=>v.type===t)?.value??'').join('-');}
