/** Analysis of availability, not an election. Never manufacture a date/time pair. */
export type AvailabilityInput = {id:number;availabilityMode:string;availableDate:string|null;availableTime:string|null;preferredWeekdays:string[]};
export const WEEK_DAYS=["lunes","martes","miercoles","jueves","viernes","sabado","domingo"] as const;
export const DAY_LABELS:Record<string,string>={lunes:"Lunes",martes:"Martes",miercoles:"Miércoles",jueves:"Jueves",viernes:"Viernes",sabado:"Sábado",domingo:"Domingo"};
export function validDate(s:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+"T12:00:00Z");return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;}
export function validTime(s:string){return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);}
export function weekday(s:string){return validDate(s)?WEEK_DAYS[(new Date(s+"T12:00:00Z").getUTCDay()+6)%7]:null;}
export function analyzeAvailability(input:AvailabilityInput[],today:string){
 const responses=[...new Map(input.map(r=>[r.id,r])).values()];const total=responses.length;
 const specific=responses.filter(r=>r.availabilityMode==="specific");const recurring=responses.filter(r=>r.availabilityMode==="weekdays");const flexible=responses.filter(r=>r.availabilityMode==="flexible").length;
 const days=WEEK_DAYS.map(day=>({day,label:DAY_LABELS[day],count:responses.filter(r=>r.availabilityMode==="specific"?weekday(r.availableDate??"")===day:r.availabilityMode==="weekdays"&&r.preferredWeekdays.includes(day)).length}));
 const candidates=new Map<string,{date:string;time:string}>();
 for(const r of specific)if(validDate(r.availableDate??"")&&validTime(r.availableTime??""))candidates.set(`${r.availableDate} ${r.availableTime}`,{date:r.availableDate!,time:r.availableTime!});
 const slots=[...candidates].map(([key,{date,time}])=>{const day=weekday(date)!;const exact=specific.filter(r=>r.availableDate===date&&r.availableTime===time).length;const weekly=recurring.filter(r=>r.preferredWeekdays.includes(day)&&(!r.availableTime||r.availableTime===time)).length;const compatible=exact+weekly+flexible;return{key,date,time,exact,weekly,flexible,compatible,percent:total?Math.round(compatible/total*100):0,past:date<today};}).sort((a,b)=>b.compatible-a.compatible||a.key.localeCompare(b.key));
 const future=slots.filter(s=>!s.past);const leaders=future.filter(s=>s.compatible===future[0]?.compatible);const maxDay=Math.max(0,...days.map(d=>d.count));
 const hours=new Map<string,number>();for(const r of responses)if(r.availabilityMode!=="flexible"&&validTime(r.availableTime??""))hours.set(r.availableTime!,1+(hours.get(r.availableTime!)??0));
 return{total,flexible,days,slots,future,leaders,leadingDays:maxDay?days.filter(d=>d.count===maxDay):[],hours:[...hours].sort(([a],[b])=>a.localeCompare(b)),modes:[{label:"Fecha y hora",count:specific.length},{label:"Varios días",count:recurring.length},{label:"Me adapto",count:flexible}]};
}
