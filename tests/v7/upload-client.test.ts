import test from 'node:test';import assert from 'node:assert/strict';
import { uploadToDrive } from '../../src/lib/media-upload.ts';
const session='https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=session';
test('subida de dos bloques confirma Drive antes de comunicar 100%',async()=>{
 const realFetch=globalThis.fetch;const previous=(globalThis as Record<string,unknown>).XMLHttpRequest;
 const sent:{url:string;headers:Record<string,string>;size:number}[]=[];const progress:number[]=[];let requests=0;
 class XHR{
  headers:Record<string,string>={};url='';timeout=0;status=0;responseText='';upload:{onprogress?:((e:{loaded:number})=>void)}={};onload?:()=>void;onerror?:()=>void;ontimeout?:()=>void;onabort?:()=>void;
  open(_method:string,url:string){this.url=url;}setRequestHeader(k:string,v:string){this.headers[k]=v;}getResponseHeader(k:string){return k==='Range'?'bytes=0-8388607':null;}abort(){this.onabort?.();}
  send(blob:Blob|null){sent.push({url:this.url,headers:this.headers,size:blob?.size??0});this.upload.onprogress?.({loaded:blob?.size??0});this.status=sent.length===1?308:200;this.responseText=this.status===200?'{"id":"fileabcdefghijk"}':'';queueMicrotask(()=>this.onload?.());}
 }
 (globalThis as Record<string,unknown>).XMLHttpRequest=XHR;
 globalThis.fetch=(async(_input:unknown,init?:RequestInit)=>{requests++;if(requests===1)return Response.json({uploadId:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',uploadUrl:session,contentType:'application/pdf'});assert.ok(progress.every(p=>p<100));const body=JSON.parse(String(init?.body));assert.equal(body.fileId,'fileabcdefghijk');return Response.json({url:'/api/drive-file?id=x',fileName:'test.pdf',path:'drive:fileabcdefghijk',uploadId:'x',driveFileId:'fileabcdefghijk'});}) as typeof fetch;
 try{const file=new File([new Uint8Array(8*1024*1024+11)],'test.pdf',{type:'application/pdf'});const result=await uploadToDrive({file,category:'biblioteca',onProgress:p=>progress.push(p)});assert.equal(result.driveFileId,'fileabcdefghijk');assert.equal(sent.length,2);assert.equal(sent[1].size,11);assert.equal(sent[1].headers['Content-Range'],'bytes 8388608-8388618/8388619');assert.ok(sent.every(s=>!('Authorization' in s.headers)));assert.equal(progress.at(-1),100);}
 finally{globalThis.fetch=realFetch;(globalThis as Record<string,unknown>).XMLHttpRequest=previous;}
});
test('no iniciar PUT si el servidor devuelve una URL ajena a Google',async()=>{const old=globalThis.fetch;globalThis.fetch=(async()=>Response.json({uploadUrl:'https://evil.example/upload',contentType:'application/pdf'})) as typeof fetch;try{await assert.rejects(uploadToDrive({file:new File(['a'],'a.pdf'),category:'biblioteca'}),/destino/);}finally{globalThis.fetch=old;}});
