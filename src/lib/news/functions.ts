import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { mergeSettings, safePublicUrl } from "./sources";
import { NEWS_CATEGORIES, LEGAL_STAGES } from "./types";
export const loadNews=createServerFn({method:"GET"}).handler(async()=>{const{getNewsFeed}=await import("./service.server");return getNewsFeed();});
export const loadNewsAdmin=createServerFn({method:"GET"}).middleware([authMiddleware]).handler(async({context})=>{
 const {requireMemberId}=await import("@/lib/access.server");await requireMemberId(context.userId,true);
 const{readNewsSettings,readEditorial}=await import("./service.server");return {settings:await readNewsSettings(),posts:await readEditorial(true)};
});
export const saveNewsSettings=createServerFn({method:"POST"}).middleware([authMiddleware]).validator(z.unknown()).handler(async({context,data})=>{
 const{requireMemberId}=await import("@/lib/access.server");await requireMemberId(context.userId,true);const settings=mergeSettings(data);const sql=await getSql();
 await sql`insert into app_settings(setting_key,setting_value,updated_by) values('news_settings_v7',${JSON.stringify(settings)},${context.userId}) on conflict(setting_key) do update set setting_value=excluded.setting_value,updated_by=excluded.updated_by,updated_at=now()`;return {ok:true};
});
export const refreshNews=createServerFn({method:"POST"}).middleware([authMiddleware]).handler(async({context})=>{
 const{requireMemberId}=await import("@/lib/access.server");await requireMemberId(context.userId,true);const{getNewsFeed}=await import("./service.server");return getNewsFeed(true);
});
const editorialSchema=z.object({id:z.number().int().positive().optional(),title:z.string().trim().min(12).max(220),summary:z.string().trim().min(10).max(600),sourceName:z.string().trim().min(3).max(140),sourceUrl:z.string().max(2000),category:z.enum(NEWS_CATEGORIES),legalStage:z.enum(LEGAL_STAGES),publishedAt:z.string().max(40).nullable(),eventDate:z.string().max(10).nullable(),imageUploadId:z.string().uuid().nullable(),videoUploadId:z.string().uuid().nullable(),youtubeId:z.string().regex(/^[\w-]{11}$/).nullable(),pinned:z.boolean(),published:z.boolean()});
export const saveEditorial=createServerFn({method:"POST"}).middleware([authMiddleware]).validator(editorialSchema).handler(async({context,data:d})=>{
 const{requireMemberId}=await import("@/lib/access.server");await requireMemberId(context.userId,true);
 const sourceUrl=safePublicUrl(d.sourceUrl);if(!sourceUrl)throw new Error("La fuente debe ser una dirección HTTPS pública válida.");
 if(d.publishedAt && (!Number.isFinite(Date.parse(d.publishedAt))||Date.parse(d.publishedAt)>Date.now()+300000))throw new Error("La fecha de publicación debe ser válida y no estar en el futuro. Usa Fecha del evento para actividades próximas.");
 if(d.eventDate && (!/^\d{4}-\d{2}-\d{2}$/.test(d.eventDate)||!Number.isFinite(Date.parse(d.eventDate))))throw new Error("Fecha del evento no válida.");
 const sql=await getSql();
 for(const[id,mime]of [[d.imageUploadId,"image/"],[d.videoUploadId,"video/"]] as const){if(!id)continue;const[r]=await sql<{mime_type:string}>`select mime_type from drive_uploads where id=${id} and category='noticias' and verified_at is not null and (user_id=${context.userId} or exists(select 1 from news_posts where id=${d.id??0} and (image_upload_id=${id} or video_upload_id=${id})))`;if(!r || !r.mime_type.startsWith(mime))throw new Error("El recurso de noticia no pertenece a tu cuenta o no tiene el formato esperado.");}
 if(d.id){const rows=await sql`update news_posts set title=${d.title},summary=${d.summary},source_name=${d.sourceName},source_url=${sourceUrl},category=${d.category},legal_stage=${d.legalStage},published_at=${d.publishedAt}::timestamptz,event_date=${d.eventDate}::date,image_upload_id=${d.imageUploadId},video_upload_id=${d.videoUploadId},youtube_id=${d.youtubeId},pinned=${d.pinned},published=${d.published} where id=${d.id} returning id`;if(!rows.length)throw new Error("No se encontró la publicación.");}
 else await sql`insert into news_posts(title,summary,source_name,source_url,category,legal_stage,published_at,event_date,image_upload_id,video_upload_id,youtube_id,pinned,published,created_by) values(${d.title},${d.summary},${d.sourceName},${sourceUrl},${d.category},${d.legalStage},${d.publishedAt}::timestamptz,${d.eventDate}::date,${d.imageUploadId},${d.videoUploadId},${d.youtubeId},${d.pinned},${d.published},${context.userId})`;
 return{ok:true};
});
export const setEditorialVisibility=createServerFn({method:"POST"}).middleware([authMiddleware]).validator(z.object({id:z.number().int().positive(),published:z.boolean()})).handler(async({context,data})=>{
 const{requireMemberId}=await import("@/lib/access.server");await requireMemberId(context.userId,true);const sql=await getSql();await sql`update news_posts set published=${data.published} where id=${data.id}`;return{ok:true};
});
