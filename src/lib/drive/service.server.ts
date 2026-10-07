import { randomUUID, sign } from "node:crypto";
import { getSql } from "@/lib/db";
import { HttpError } from "@/lib/access.server";
import { parseFolderId, validUploadSession, type UploadInput } from "./validation";
const API = "https://www.googleapis.com/drive/v3";
let tokenCache: { token: string; expires: number } | null = null;
let tokenPromise: Promise<string> | null = null;
export function credentialMode(): "oauth" | "service-account" | "none" {
  if (process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_CLIENT_SECRET && process.env.GOOGLE_DRIVE_REFRESH_TOKEN) return "oauth";
  return process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON ? "service-account" : "none";
}
export async function rootFolderId(): Promise<string> {
  const sql = await getSql();
  const [row] = await sql<{setting_value:string}>`select setting_value from app_settings where setting_key='google_drive_folder_id'`;
  const value = row?.setting_value || process.env.GOOGLE_DRIVE_FOLDER_ID || "";
  if (!value) throw new HttpError(503,"Falta la carpeta de Google Drive. Configúrala en Control.");
  try { return parseFolderId(value); } catch { throw new HttpError(503,"La carpeta de Google Drive no es válida."); }
}
async function refreshToken(): Promise<string> {
  const mode = credentialMode();
  const body = new URLSearchParams();
  if (mode === "oauth") {
    body.set("grant_type","refresh_token"); body.set("client_id",process.env.GOOGLE_DRIVE_CLIENT_ID!);
    body.set("client_secret",process.env.GOOGLE_DRIVE_CLIENT_SECRET!); body.set("refresh_token",process.env.GOOGLE_DRIVE_REFRESH_TOKEN!);
  } else if (mode === "service-account") {
    let sa: {client_email?:string;private_key?:string};
    try { sa = JSON.parse(process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON!); } catch { throw new HttpError(503,"El JSON de la cuenta de servicio no es válido."); }
    if (!sa.client_email || !sa.private_key) throw new HttpError(503,"La cuenta de servicio está incompleta.");
    const now = Math.floor(Date.now()/1000);
    const encoded = [ {alg:"RS256",typ:"JWT"}, {iss:sa.client_email,scope:"https://www.googleapis.com/auth/drive",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600} ].map((v) => Buffer.from(JSON.stringify(v)).toString("base64url")).join(".");
    const signature = sign("RSA-SHA256",Buffer.from(encoded),sa.private_key.replace(/\\n/g,"\n")).toString("base64url");
    body.set("grant_type","urn:ietf:params:oauth:grant-type:jwt-bearer"); body.set("assertion",`${encoded}.${signature}`);
  } else throw new HttpError(503,"Falta autorizar Google Drive. Sigue CONFIGURAR-DRIVE.md; una liga de carpeta no concede permiso de subida.");
  const response = await fetch("https://oauth2.googleapis.com/token",{method:"POST",body,signal:AbortSignal.timeout(15000)});
  const data = await response.json() as {access_token?:string;expires_in?:number};
  if (!response.ok || !data.access_token) throw new HttpError(503,"Google rechazó la autorización. Renueva el token OAuth o revisa la cuenta de servicio.");
  tokenCache = {token:data.access_token,expires:Date.now()+(Number(data.expires_in)||3600)*1000-90000};
  return data.access_token;
}
export async function accessToken(): Promise<string> {
  if (tokenCache && tokenCache.expires > Date.now()) return tokenCache.token;
  if (!tokenPromise) tokenPromise = refreshToken().finally(() => { tokenPromise=null; });
  return tokenPromise;
}
export async function driveFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(init.headers); headers.set("Authorization",`Bearer ${await accessToken()}`);
  const response = await fetch(`${API}${path}`,{...init,headers,redirect:"error",signal:init.signal ?? AbortSignal.timeout(20000)});
  if (response.status === 401 && retry) { tokenCache=null; return driveFetch(path,init,false); }
  return response;
}
export function checkDrive(response: Response): void {
  if (response.ok) return;
  const message = response.status === 403 ? "Drive denegó el acceso: revisa permisos, cuota y alcance OAuth. Las cuentas de servicio necesitan una unidad compartida." : response.status === 404 ? "Drive no encuentra el recurso o la cuenta no tiene acceso." : response.status === 429 ? "Google ha limitado las solicitudes. Inténtalo de nuevo más tarde." : "Google Drive no respondió correctamente.";
  throw new HttpError(response.status === 429 ? 429 : 502,message);
}
export type DriveMetadata = { id:string; name:string; mimeType:string; size?:string; parents?:string[]; driveId?:string; trashed?:boolean; appProperties?:Record<string,string>; capabilities?:{canAddChildren?:boolean} };
export async function folderInfo(id: string): Promise<DriveMetadata> {
  const response = await driveFetch(`/files/${encodeURIComponent(id)}?supportsAllDrives=true&fields=id,name,mimeType,driveId,trashed,capabilities(canAddChildren)`); checkDrive(response);
  const info = await response.json() as DriveMetadata;
  if (info.mimeType !== "application/vnd.google-apps.folder" || info.trashed || !info.capabilities?.canAddChildren) throw new HttpError(400,"El destino debe ser una carpeta editable, no un archivo ni un acceso directo.");
  if (credentialMode() === "service-account" && !info.driveId) throw new HttpError(400,"Una cuenta de servicio no puede ser propietaria de archivos en Mi unidad. Usa OAuth para una cuenta personal o una unidad compartida de Workspace.");
  return info;
}
async function childFolder(parent: string, name: string): Promise<string> {
  const q = `'${parent.replace(/'/g,"\\'")}' in parents and name = '${name.replace(/'/g,"\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const params = new URLSearchParams({q,fields:"files(id)",pageSize:"1",supportsAllDrives:"true",includeItemsFromAllDrives:"true"});
  const response = await driveFetch(`/files?${params}`); checkDrive(response);
  const data = await response.json() as {files:{id:string}[]};
  if (data.files[0]) return data.files[0].id;
  const created = await driveFetch("/files?supportsAllDrives=true&fields=id",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,mimeType:"application/vnd.google-apps.folder",parents:[parent]})}); checkDrive(created);
  return (await created.json() as {id:string}).id;
}
export async function beginDriveUpload(userId: string, input: UploadInput, origin: string) {
  const sql = await getSql();
  const [quota] = await sql<{count:string;bytes:string}>`select count(*)::text as count,coalesce(sum(expected_size),0)::text as bytes from drive_uploads where user_id=${userId} and created_at>now()-interval '24 hours'`;
  // Includes incomplete sessions, so opening sessions is not a quota bypass.
  if (Number(quota?.count) >= 100 || Number(quota?.bytes)+input.size > 5*1024**3) throw new HttpError(429,"Límite diario: 100 intentos de subida o 5 GB por usuario.");
  const reserved = await sql`insert into drive_daily_quotas(user_id,quota_day,attempts,reserved_bytes) values(${userId},current_date,1,${input.size}) on conflict(user_id,quota_day) do update set attempts=drive_daily_quotas.attempts+1,reserved_bytes=drive_daily_quotas.reserved_bytes+excluded.reserved_bytes where drive_daily_quotas.attempts<100 and drive_daily_quotas.reserved_bytes+excluded.reserved_bytes<=5368709120 returning attempts`;
  if(!reserved.length) throw new HttpError(429,"Límite de subidas diario alcanzado.");
  let parent = await rootFolderId(); await folderInfo(parent);
  for (const segment of [input.category,...input.subfolder]) parent = await childFolder(parent,segment);
  const uploadId = randomUUID();
  // Reserve first so concurrent/failed initiations remain visible to the quota check.
  await sql`insert into drive_uploads(id,user_id,category,file_name,mime_type,expected_size,parent_id) values(${uploadId},${userId},${input.category},${input.fileName},${input.contentType},${input.size},${parent})`;
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id",{
    method:"POST",redirect:"error",signal:AbortSignal.timeout(20000),
    headers:{Authorization:`Bearer ${await accessToken()}`,"Content-Type":"application/json; charset=UTF-8","X-Upload-Content-Type":input.contentType,"X-Upload-Content-Length":String(input.size),Origin:origin},
    body:JSON.stringify({name:input.fileName,mimeType:input.contentType,parents:[parent],appProperties:{facultaUploadId:uploadId}}),
  }); checkDrive(response);
  const uploadUrl = response.headers.get("Location");
  if (!uploadUrl || !validUploadSession(uploadUrl)) throw new HttpError(502,"Google no devolvió una sesión de subida válida.");
  return {uploadId,uploadUrl,contentType:input.contentType};
}
export async function completeDriveUpload(userId: string, uploadId: string, fileId: string) {
  const sql = await getSql();
  const [row] = await sql<{user_id:string;mime_type:string;expected_size:string;parent_id:string;file_name:string;drive_file_id:string|null}>`select * from drive_uploads where id=${uploadId}`;
  if (!row || row.user_id !== userId) throw new HttpError(404,"Sesión de subida no encontrada.");
  if (row.drive_file_id && row.drive_file_id !== fileId) throw new HttpError(409,"La sesión ya tiene otro archivo.");
  const response = await driveFetch(`/files/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=id,name,mimeType,size,parents,appProperties,trashed`); checkDrive(response);
  const info = await response.json() as DriveMetadata;
  if (info.trashed || info.size !== String(row.expected_size) || info.mimeType !== row.mime_type || !info.parents?.includes(row.parent_id) || info.appProperties?.facultaUploadId !== uploadId) throw new HttpError(400,"El archivo recibido no coincide con la sesión autorizada. No se publicará.");
  await sql`update drive_uploads set drive_file_id=${fileId},verified_at=now() where id=${uploadId} and user_id=${userId}`;
  return {fileName:row.file_name,driveFileId:fileId};
}
