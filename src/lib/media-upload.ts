import { validUploadSession, uploadedOffset, type MediaCategory } from "./drive/validation.ts";
export type { MediaCategory } from "./drive/validation.ts";
export type UploadedMedia = { url:string;fileName:string;path:string;uploadId:string;driveFileId:string };
const CHUNK=8*1024*1024; // Drive requires a multiple of 256 KiB except for the last part.
const delay=(ms:number)=>new Promise((resolve)=>setTimeout(resolve,ms));
async function post(path:string,body:unknown) {
  const response=await fetch(path,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data=await response.json().catch(()=>({error:"Respuesta no válida del servidor."}));
  if (!response.ok) throw new Error(data.error || "No se pudo completar la subida.");
  return data;
}
function put(url:string,blob:Blob|null,range:string,mime:string,signal:AbortSignal|undefined,onBytes?:(n:number)=>void):Promise<{status:number;range:string|null;id?:string}> {
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    const abort=()=>xhr.abort();
    if (signal?.aborted) { reject(new DOMException("Subida cancelada","AbortError")); return; }
    signal?.addEventListener("abort",abort,{once:true});
    const clean=()=>signal?.removeEventListener("abort",abort);
    xhr.open("PUT",url); xhr.timeout=120000; xhr.setRequestHeader("Content-Type",mime); xhr.setRequestHeader("Content-Range",range);
    xhr.upload.onprogress=(event)=>onBytes?.(event.loaded);
    xhr.onerror=()=>{clean();reject(new Error("Se interrumpió la conexión con Drive."));};
    xhr.ontimeout=()=>{clean();reject(new Error("Drive tardó demasiado en recibir el bloque."));};
    xhr.onabort=()=>{clean();reject(new DOMException("Subida cancelada","AbortError"));};
    xhr.onload=()=>{clean();let id:string|undefined;try { id=JSON.parse(xhr.responseText)?.id; }catch{ /* 308 has no JSON body. */ } resolve({status:xhr.status,range:xhr.getResponseHeader("Range"),id});};
    xhr.send(blob);
  });
}
export async function uploadToDrive({file,category,subfolder="",onProgress,signal}:{file:File;category:MediaCategory;subfolder?:string;onProgress?:(percentage:number)=>void;signal?:AbortSignal}):Promise<UploadedMedia> {
  onProgress?.(0);
  const session=await post("/api/drive-upload",{category,subfolder,fileName:file.name,contentType:file.type,size:file.size}) as {uploadId:string;uploadUrl:string;contentType:string};
  if (!validUploadSession(session.uploadUrl)) throw new Error("El destino de subida no es Google Drive.");
  let offset=0,failures=0,fileId:string|undefined;
  while (offset<file.size && !fileId) {
    const end=Math.min(offset+CHUNK,file.size);
    try {
      const response=await put(session.uploadUrl,file.slice(offset,end),`bytes ${offset}-${end-1}/${file.size}`,session.contentType,signal,(loaded)=>onProgress?.(Math.min(99,Math.floor((offset+loaded)/file.size*100))));
      if (response.status === 200 || response.status === 201) { fileId=response.id; if (!fileId) throw new Error("Drive no devolvió el identificador del archivo."); break; }
      if (response.status === 308) {
        const next=uploadedOffset(response.range);
        // Range must be CORS-exposed by Google; never assume an unacknowledged block arrived.
        if (next<=offset || next>file.size) throw new Error("No se pudo confirmar el bloque recibido por Drive.");
        offset=next; failures=0; continue;
      }
      if (response.status === 404 || response.status === 410) throw new Error("La sesión de Drive caducó. Vuelve a seleccionar el archivo.");
      if (response.status<500 && ![408,429].includes(response.status)) throw Object.assign(new Error(`Drive rechazó el archivo (${response.status}).`),{fatal:true});
      throw new Error("Drive está ocupado.");
    } catch(error) {
      if (signal?.aborted || (error as {name?:string})?.name === "AbortError" || (error as {fatal?:boolean})?.fatal) throw error;
      if (++failures>4) throw new Error("No se pudo terminar la subida después de cuatro reintentos. Revisa la conexión y la configuración de Drive.");
      await delay(Math.min(16000,2**failures*700));
      const state=await put(session.uploadUrl,null,`bytes */${file.size}`,session.contentType,signal).catch(()=>null);
      if (state?.status === 200 || state?.status === 201) fileId=state.id;
      else if (state?.status === 308) offset=uploadedOffset(state.range);
      else if (state?.status === 404 || state?.status === 410) throw new Error("La sesión de Drive caducó. Vuelve a subir el archivo.");
    }
  }
  if (!fileId) throw new Error("Drive no confirmó el archivo completo.");
  // Success is reported only after the server independently checks parent, MIME and size.
  const stored=await post("/api/drive-complete",{uploadId:session.uploadId,fileId}) as UploadedMedia;
  onProgress?.(100); return stored;
}
