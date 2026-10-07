import type { Course, EventItem } from "./types.ts";
export const CAMPUS_TIMEZONE = "America/Mexico_City";
export function campusClock(now: number) {
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:CAMPUS_TIMEZONE,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now);
 const get=(key:string)=>parts.find(p=>p.type===key)?.value??"00";
 const date=`${get("year")}-${get("month")}-${get("day")}`;
 return {date,weekday:new Date(`${date}T12:00:00Z`).getUTCDay(),minutes:Number(get("hour"))*60+Number(get("minute"))};
}
const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
export function nextCourse(courses:Course[],now:number){
 const clock=campusClock(now),days=["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];
 const candidates=courses.flatMap(course=>{
  const weekday=days.indexOf(normalize(course.weekday));const match=course.timeSlot.match(/(?:^|\s)([01]?\d|2[0-3]):([0-5]\d)/);if(weekday<0||!match)return [];
  const minutes=Number(match[1])*60+Number(match[2]);let offset=(weekday-clock.weekday+7)%7;if(offset===0&&minutes<clock.minutes)offset=7;
  const date=new Date(`${clock.date}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+offset);
  return [{course,date:date.toISOString().slice(0,10),distance:offset*1440+minutes-clock.minutes}];
 });return candidates.sort((a,b)=>a.distance-b.distance||a.course.id-b.course.id)[0]??null;
}
export function upcomingEvents(events:EventItem[],today:string){return events.filter(e=>/^\d{4}-\d{2}-\d{2}$/.test(e.eventDate)&&Number.isFinite(Date.parse(e.eventDate))&&new Date(e.eventDate).toISOString().slice(0,10)===e.eventDate&&e.eventDate>=today).slice().sort((a,b)=>a.eventDate.localeCompare(b.eventDate)||a.timeSlot.localeCompare(b.timeSlot)).slice(0,4);}
