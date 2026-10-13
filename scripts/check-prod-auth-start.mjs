#!/usr/bin/env node
/** Simulate Vercel Production with intentionally absent secret but no remote DB. */
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const url="http://127.0.0.1:8080";
const env={...process.env,VERCEL_ENV:"production",BETTER_AUTH_SECRET:"",DATABASE_URL:"",BETTER_AUTH_URL:url,APP_PUBLIC_URL:url,VITE_PUBLIC_HOSTNAME:"127.0.0.1:8080",VITE_AUTH_ENABLED:"true"};
const child=spawn("npm",["run","dev"],{env,stdio:["ignore","pipe","pipe"],detached:true});
let output="";for(const stream of [child.stdout,child.stderr])stream.on("data",data=>{output+=data.toString();});
try{
 let ready=false;
 for(let i=0;i<50;i++){
  try{const res=await fetch(url,{signal:AbortSignal.timeout(1200)});if(res.status===200){ready=true;break}}catch{}
  await new Promise(r=>setTimeout(r,500));
 }
 assert.ok(ready,"Public homepage must be accessible without BETTER_AUTH_SECRET. Server: "+output.slice(-1300));
 const r=await fetch(url+"/api/auth/get-session",{signal:AbortSignal.timeout(4000)});
 assert.equal(r.status,503,"Auth must fail closed while the secret is missing");
 assert.equal((await r.json()).code,"AUTH_UNAVAILABLE");
 console.log("PASS: public homepage 200; auth endpoint 503 without secret; no remote database used");
}finally{if(child.pid)try{process.kill(-child.pid,"SIGTERM");}catch{}}
