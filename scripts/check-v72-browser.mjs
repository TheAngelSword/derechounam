/** Local CI server only: no Production URL, remote DB, user credentials or production mutations. */
import {spawn} from 'node:child_process';import fs from 'node:fs/promises';import {chromium} from 'playwright';import assert from 'node:assert/strict';
const dir='test-results/v72';await fs.mkdir(dir,{recursive:true});
const env={...process.env,DATABASE_URL:'',BETTER_AUTH_URL:'http://localhost:8080',APP_PUBLIC_URL:'http://localhost:8080',VITE_PUBLIC_HOSTNAME:'localhost:8080',VITE_AUTH_ENABLED:'true',BETTER_AUTH_SECRET:'temporary-local-ci-only-not-for-production-72'};
const server=spawn('npm',['run','dev'],{env,stdio:['ignore','pipe','pipe'],detached:true});let output='';for(const stream of [server.stdout,server.stderr])stream.on('data',b=>{output+=b.toString();});let browser;
try{let ready=false;for(let i=0;i<90;i++){try{const r=await fetch('http://localhost:8080/',{signal:AbortSignal.timeout(1500)});if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,1000));}assert.ok(ready,'El servidor local no arrancó');
 browser=await chromium.launch({headless:true});const report=[];const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,1920,390]){await page.setViewportSize({width,height:1000});for(const [path,title,label]of [['/','Un portal para ti.','inicio'],['/noticias','Todas las noticias','noticias'],['/rutas','Comparte tu vehículo','rutas']]){
  await page.goto(`http://localhost:8080${path}`,{waitUntil:'domcontentloaded'});await page.locator('.fd-v72').waitFor();assert.equal((await page.locator('h1').innerText()).trim(),title);await page.waitForTimeout(1500);
  const boxes=await page.evaluate(()=>{const main=document.querySelector('.fd-main').getBoundingClientRect();const workspace=document.querySelector('.fd-workspace').getBoundingClientRect();return{scroll:document.documentElement.scrollWidth,viewport:innerWidth,mainLeft:main.x,mainWidth:main.width,workspaceLeft:workspace.x};});
  assert.ok(boxes.scroll<=width+1,`Desbordamiento horizontal en ${path} a ${width}: ${boxes.scroll}`);assert.ok(boxes.mainWidth>width*(width>959?.70:.95),`Contenido demasiado estrecho en ${path}`);report.push({width,path,...boxes});await page.screenshot({path:`${dir}/${label}-${width}.png`,fullPage:true});
 }}
 assert.deepEqual(errors,[],'Errores JavaScript de interfaz');await fs.writeFile(`${dir}/layout.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({screens:report.length,errors,report}));
}finally{await browser?.close();try{process.kill(-server.pid,'SIGTERM');}catch{}await fs.writeFile(`${dir}/server.log`,output);}
