import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { parseFolderId } from "./validation";
export type DriveStatus={configured:boolean;authorized:boolean;folderId:string;credentialMode:string;message:string;folderName?:string};
export const loadDriveStatus=createServerFn({method:"GET"}).middleware([authMiddleware]).handler(async ({context}):Promise<DriveStatus>=>{
  const {requireMemberId}=await import("@/lib/access.server"); await requireMemberId(context.userId,true);
  const {credentialMode,rootFolderId}=await import("./service.server");
  const mode=credentialMode(); let folderId="";try{folderId=await rootFolderId();}catch{/* Incomplete settings are displayed, not hidden. */}
  return {configured:mode!=="none" && !!folderId,authorized:false,folderId,credentialMode:mode,message:mode === "none" ? "Falta autorizar la cuenta en las variables del servidor." : !folderId ? "Falta la carpeta raíz." : "Credenciales presentes. Pulsa Probar conexión para verificar permisos reales."};
});
export const testDriveConnection=createServerFn({method:"POST"}).middleware([authMiddleware]).handler(async ({context}):Promise<DriveStatus>=>{
  const {requireMemberId}=await import("@/lib/access.server"); await requireMemberId(context.userId,true);
  const {credentialMode,rootFolderId,folderInfo}=await import("./service.server");
  const id=await rootFolderId();const info=await folderInfo(id);
  return {configured:true,authorized:true,folderId:id,folderName:info.name,credentialMode:credentialMode(),message:`Conexión correcta. Carpeta editable: ${info.name}. No se ha subido ningún archivo de prueba.`};
});
export const saveDriveFolder=createServerFn({method:"POST"}).middleware([authMiddleware]).validator(z.object({folder:z.string().min(10).max(500)})).handler(async ({context,data})=>{
  const {requireMemberId}=await import("@/lib/access.server"); await requireMemberId(context.userId,true);
  const id=parseFolderId(data.folder);
  const {folderInfo}=await import("./service.server");await folderInfo(id);
  const sql=await getSql();
  await sql`insert into app_settings(setting_key,setting_value,updated_by) values('google_drive_folder_id',${id},${context.userId}) on conflict(setting_key) do update set setting_value=excluded.setting_value,updated_by=excluded.updated_by,updated_at=now()`;
  return {ok:true};
});
