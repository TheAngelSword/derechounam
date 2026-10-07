#!/usr/bin/env node
/** Local, one-time OAuth authorization. No dependencies. Never run on the public server. */
import { createServer } from 'node:http';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const args=process.argv.slice(2);
const arg=(name)=>args.find(v=>v.startsWith(`--${name}=`))?.slice(name.length+3);
const credentialsPath=arg('credentials');
if(!credentialsPath||args.includes('--help')){
 console.log(`Autorización local de Drive para Faculta de Derecho\n\nCuenta personal, carpeta nueva (menor alcance):\n  node scripts/authorize-drive.mjs --credentials=./client_secret.json\n\nCarpeta existente (permiso amplio: leer/escribir Drive; usar cuenta dedicada):\n  node scripts/authorize-drive.mjs --credentials=./client_secret.json --folder=ID --allow-full-drive\n\nSe abre un servidor sólo en 127.0.0.1:8765. El resultado se guarda en .env.drive.local.\nNo compartas ese archivo ni el JSON de credenciales. --overwrite permite reemplazar el resultado local.`);
 process.exit(credentialsPath?0:1);
}
const existingFolder=arg('folder');
if(existingFolder&&!/^[\w-]{10,200}$/.test(existingFolder))throw new Error('Usa únicamente el ID de la carpeta.');
if(existingFolder&&!args.includes('--allow-full-drive'))throw new Error('Para una carpeta existente no seleccionada por Picker se necesita un alcance más amplio. Usa una cuenta dedicada y agrega --allow-full-drive sólo después de aceptar este permiso; o crea una carpeta nueva sin --folder.');
const raw=JSON.parse(await readFile(resolve(credentialsPath),'utf8'));
const creds=raw.installed??raw.web;
if(!creds?.client_id||!creds?.client_secret)throw new Error('Selecciona el JSON OAuth de una aplicación de escritorio o web. No un JSON de cuenta de servicio.');
const output=resolve('.env.drive.local');
if(!args.includes('--overwrite')){try{await readFile(output);throw new Error('El archivo .env.drive.local ya existe. Respalda la autorización anterior o usa --overwrite explícitamente.');}catch(e){if(e.code!=='ENOENT')throw e;}}
const redirect='http://127.0.0.1:8765/oauth2/callback';
const state=randomBytes(32).toString('base64url');const verifier=randomBytes(48).toString('base64url');
const scope=existingFolder?'https://www.googleapis.com/auth/drive':'https://www.googleapis.com/auth/drive.file';
const authUrl=new URL('https://accounts.google.com/o/oauth2/v2/auth');
for(const[k,v]of Object.entries({client_id:creds.client_id,redirect_uri:redirect,response_type:'code',scope,access_type:'offline',prompt:'consent',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}))authUrl.searchParams.set(k,v);
let finish,fail;const callback=new Promise((res,rej)=>{finish=res;fail=rej;});
const server=createServer((req,res)=>{
 const u=new URL(req.url??'/','http://127.0.0.1:8765');if(u.pathname!=='/oauth2/callback'){res.writeHead(404).end();return;}
 const received=u.searchParams.get('state')??'';
 if(Buffer.byteLength(received)!==Buffer.byteLength(state)||!timingSafeEqual(Buffer.from(received),Buffer.from(state))){res.writeHead(400).end('Estado de autorizacion no valido.');return;}
 if(u.searchParams.get('error')){res.writeHead(400,{'Content-Type':'text/plain;charset=utf-8'}).end('Autorización cancelada. Regresa a la terminal.');fail(new Error('Google no concedió el permiso.'));return;}
 const code=u.searchParams.get('code');if(!code){res.writeHead(400).end('Falta codigo.');return;}
 res.writeHead(200,{'Content-Type':'text/plain;charset=utf-8','Cache-Control':'no-store'}).end('Código recibido. Cierra esta ventana y revisa la terminal. Ningún token se muestra aquí.');finish(code);
});
const timer=setTimeout(()=>fail(new Error('La autorización caducó después de diez minutos. Ejecuta de nuevo el asistente.')),600000);
try{
 await new Promise((res,rej)=>{server.once('error',rej);server.listen(8765,'127.0.0.1',res);});
 console.log('Abre esta dirección en el navegador del MISMO equipo, comprueba la cuenta y autoriza el acceso:\n\n'+authUrl.href+'\n');
 const code=await callback;
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',code,client_id:creds.client_id,client_secret:creds.client_secret,redirect_uri:redirect,code_verifier:verifier}),signal:AbortSignal.timeout(20000)});
 const token=await response.json();if(!response.ok||!token.access_token||!token.refresh_token)throw new Error('No se obtuvo una autorización renovable. Revisa el tipo de cliente, redirect URI, usuario de prueba y permiso offline. No publiques el error con credenciales.');
 let folderId=existingFolder;
 if(!folderId){const created=await fetch('https://www.googleapis.com/drive/v3/files?fields=id',{method:'POST',headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({name:'Faculta de Derecho',mimeType:'application/vnd.google-apps.folder'}),signal:AbortSignal.timeout(20000)});if(!created.ok)throw new Error('Google autorizó la cuenta pero no permitió crear la carpeta. Revisa Drive API y la cuota.');folderId=(await created.json()).id;}
 if(!folderId)throw new Error('Google no devolvió el ID de carpeta.');
 const values={GOOGLE_DRIVE_CLIENT_ID:creds.client_id,GOOGLE_DRIVE_CLIENT_SECRET:creds.client_secret,GOOGLE_DRIVE_REFRESH_TOKEN:token.refresh_token,GOOGLE_DRIVE_FOLDER_ID:folderId};
 await writeFile(output,'# SECRETOS: no subir a GitHub, chats ni adjuntos. Sólo variables privadas del servidor.\n'+Object.entries(values).map(([k,v])=>`${k}=${JSON.stringify(v)}`).join('\n')+'\n',{encoding:'utf8',mode:0o600,flag:args.includes('--overwrite')?'w':'wx'});
 console.log(`Autorización guardada localmente en ${output}.\nCarpeta: https://drive.google.com/drive/folders/${folderId}\nCopia las cuatro variables al entorno PRIVADO del servidor (sin comillas envolventes en el panel).\nNo pegues tokens o secretos en el chat. Luego despliega y usa Control → Google Drive → Probar conexión.`);
}catch(e){console.error(e instanceof Error?e.message:'No se pudo completar la autorización.');process.exitCode=1;}
finally{clearTimeout(timer);server.closeAllConnections();server.close();}
