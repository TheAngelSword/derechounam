import {getSql} from '@/lib/db';
import {credentialMode,rootFolderId,folderInfo,driveFetch,checkDrive} from './service.server';
export async function driveDiagnostics(verify=false){
 const sql=await getSql();const mode=credentialMode();let folderId='';try{folderId=await rootFolderId();}catch{}
 const [folderSetting]=await sql<{setting_value:string}>`select setting_value from app_settings where setting_key='google_drive_folder_id'`;
 const needed=mode==='service-account'?['GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON']:['GOOGLE_DRIVE_CLIENT_ID','GOOGLE_DRIVE_CLIENT_SECRET','GOOGLE_DRIVE_REFRESH_TOKEN'];
 const missing=needed.filter(name=>!process.env[name]);if(!folderId)missing.push('GOOGLE_DRIVE_FOLDER_ID o carpeta en Control');
 const [stats]=await sql<{confirmed:string;pending:string}>`select count(*) filter(where verified_at is not null)::text as confirmed,count(*) filter(where verified_at is null)::text as pending from drive_uploads`;
 const recent=await sql<{file_name:string;category:string;drive_file_id:string;verified_at:string}>`select file_name,category,drive_file_id,verified_at from drive_uploads where verified_at is not null order by verified_at desc limit 5`;
 const result={configured:mode!=='none'&&!!folderId,authorized:false,folderId,credentialMode:mode,folderSource:folderSetting?.setting_value?'Control (base de datos)':'Variable del servidor',environment:process.env.VERCEL_ENV??process.env.NODE_ENV??'local',branch:process.env.VERCEL_GIT_COMMIT_REF??'',missing,confirmed:Number(stats?.confirmed??0),pending:Number(stats?.pending??0),recent,message:missing.length?'Configuración incompleta: todavía no se ha comprobado una subida.':'Credenciales presentes, pero permisos y carpeta aún no comprobados.'};
 if(!verify)return result;
 const id=await rootFolderId();const info=await folderInfo(id);
 const params=new URLSearchParams({q:`'${id}' in parents and trashed = false`,fields:'files(id,mimeType),nextPageToken',pageSize:'100',supportsAllDrives:'true',includeItemsFromAllDrives:'true'});
 const response=await driveFetch(`/files?${params}`);checkDrive(response);const listing=await response.json() as {files:{id:string;mimeType:string}[];nextPageToken?:string};
 return {...result,authorized:true,folderName:info.name,visibleRootItems:listing.files.length,moreRootItems:!!listing.nextPageToken,message:`Carpeta editable comprobada: ${info.name}. Esta prueba sólo leyó la carpeta; todavía no demuestra una subida nueva.`};
}
