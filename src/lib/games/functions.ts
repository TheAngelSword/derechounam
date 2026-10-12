import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { authMiddleware } from '@/lib/auth/middleware';
import { getSql } from '@/lib/db';
import { GAME_MODES, gradeAttempt } from './engine';
import { GAME_SUBJECTS } from './bank';
const subject=z.string().refine(v=>GAME_SUBJECTS.some(s=>s.id===v),'Materia no válida');
export type PracticeHistory={attempts:{id:string;subject_id:string;mode:string;correct:number;total:number;seconds:number;created_at:string}[];notes:{subject_id:string;body:string;revision:number}[]};
export const loadPractice=createServerFn({method:'GET'}).middleware([authMiddleware]).handler(async({context}):Promise<PracticeHistory>=>{
 const {requireMemberId}=await import('@/lib/access.server');await requireMemberId(context.userId);
 const sql=await getSql();const attempts=await sql<PracticeHistory['attempts'][number]>`select id,subject_id,mode,correct,total,seconds,created_at from study_game_attempts where user_id=${context.userId} order by created_at desc limit 50`;
 const notes=await sql<PracticeHistory['notes'][number]>`select subject_id,body,revision from study_game_notes where user_id=${context.userId}`;return {attempts,notes};
});
export const recordPractice=createServerFn({method:'POST'}).middleware([authMiddleware]).validator(z.object({id:z.string().uuid(),subject,mode:z.enum(GAME_MODES),seconds:z.number().int().min(0).max(86400),answers:z.array(z.object({id:z.string().max(90),value:z.string().max(300),comparedId:z.string().max(90).optional()})).min(1).max(20)})).handler(async({context,data})=>{
 const {requireMemberId}=await import('@/lib/access.server');await requireMemberId(context.userId);const result=gradeAttempt(data);const sql=await getSql();
 // Retries are idempotent; never update another account's record and never store supplied user IDs.
 await sql`insert into study_game_attempts(id,user_id,subject_id,mode,correct,total,seconds) values(${data.id},${context.userId},${data.subject},${data.mode},${result.correct},${result.total},${data.seconds}) on conflict(id) do nothing`;
 return {ok:true,...result};
});
export const savePracticeNote=createServerFn({method:'POST'}).middleware([authMiddleware]).validator(z.object({subject,body:z.string().max(4000),revision:z.number().int().min(0)})).handler(async({context,data})=>{
 const {requireMemberId}=await import('@/lib/access.server');await requireMemberId(context.userId);const sql=await getSql();
 const rows=data.revision===0?await sql`insert into study_game_notes(user_id,subject_id,body) values(${context.userId},${data.subject},${data.body}) on conflict do nothing returning revision`:await sql`update study_game_notes set body=${data.body},revision=revision+1,updated_at=now() where user_id=${context.userId} and subject_id=${data.subject} and revision=${data.revision} returning revision`;
 if(!rows[0])throw new Error('La nota cambió en otra pestaña. Recarga tus notas antes de guardar.');return {ok:true};
});
