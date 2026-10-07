import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { requireMemberRequest, apiError, HttpError } from "@/lib/access.server";
import { driveFetch, checkDrive } from "@/lib/drive/service.server";
async function serve(request: Request): Promise<Response> {
  try {
    const url=new URL(request.url); const id=url.searchParams.get("id") ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404,"Archivo no encontrado.");
    const sql=await getSql();
    const [file]=await sql<{drive_file_id:string;mime_type:string;file_name:string;category:string}>`select drive_file_id,mime_type,file_name,category from drive_uploads where id=${id} and verified_at is not null`;
    if (!file) throw new HttpError(404,"Archivo no encontrado o subida incompleta.");
    // A news upload is public only after a moderator actually publishes a reference.
    const posts=file.category === "noticias" ? await sql`select id from news_posts where published=true and (image_upload_id=${id} or video_upload_id=${id}) limit 1` : [];
    if (!posts.length) await requireMemberRequest(request);
    const range=request.headers.get("Range");
    if (range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range)) throw new HttpError(416,"Rango no válido.");
    const response=await driveFetch(`/files/${encodeURIComponent(file.drive_file_id)}?alt=media&supportsAllDrives=true`,{headers:range ? {Range:range} : {},signal:AbortSignal.timeout(240000),method:request.method === "HEAD" ? "HEAD" : "GET"});
    if (response.status === 416) return new Response(null,{status:416,headers:{"Cache-Control":"no-store"}});
    checkDrive(response);
    const inline=/^(image\/(jpeg|png|webp)|audio\/|video\/|application\/pdf)/.test(file.mime_type) && !url.searchParams.has("download");
    const headers=new Headers({"Content-Type":file.mime_type,"Content-Disposition":`${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.file_name)}`,"X-Content-Type-Options":"nosniff","Cache-Control":"private, no-store","Content-Security-Policy":"sandbox","Accept-Ranges":"bytes","Referrer-Policy":"no-referrer","Cross-Origin-Resource-Policy":"same-origin"});
    for (const key of ["Content-Length","Content-Range"]) { const value=response.headers.get(key); if (value) headers.set(key,value); }
    return new Response(request.method === "HEAD" ? null : response.body,{status:response.status,headers});
  } catch(error) { return apiError(error); }
}
export const Route = createFileRoute("/api/drive-file")({server:{handlers:{GET:({request})=>serve(request),HEAD:({request})=>serve(request)}}});
