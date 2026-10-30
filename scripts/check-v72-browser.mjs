/** Local CI server only: no Production URL, remote DB, user credentials or production mutations. */
import {spawn} from 'node:child_process';import fs from 'node:fs/promises';import {chromium} from 'playwright';import assert from 'node:assert/strict';
const dir='test-results/v72';await fs.mkdir(dir,{recursive:true});
const env={...process.env,DATABASE_URL:'',BETTER_AUTH_URL:'http://localhost:8080',APP_PUBLIC_URL:'http://localhost:8080',VITE_PUBLIC_HOSTNAME:'localhost:8080',VITE_AUTH_ENABLED:'true',BETTER_AUTH_SECRET:'temporary-local-ci-only-not-for-production-72'};
const server=spawn('npm',['run','dev'],{env,stdio:['ignore','pipe','pipe'],detached:true});let output='';for(const stream of [server.stdout,server.stderr])stream.on('data',b=>{output+=b.toString();});let browser;
try{let ready=false;for(let i=0;i<90;i++){try{const r=await fetch('http://localhost:8080/',{signal:AbortSignal.timeout(1500)});if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,1000));}assert.ok(ready,'El servidor local no arrancó');
 browser=await chromium.launch({headless:true});const report=[];const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,1920,390]){await page.setViewportSize({width,height:1000});for(const [path,title,label]of [['/','Portal Facultad de Derecho ALUMNOS','inicio'],['/noticias','Todas las noticias','noticias'],['/rutas','Comparte tu vehículo','rutas']]){
  await page.goto(`http://localhost:8080${path}`,{waitUntil:'domcontentloaded'});await page.locator('.fd-v72').waitFor();assert.equal((await page.locator('h1').innerText()).trim(),title);await page.waitForTimeout(1500);
  if(path==='/') {
   const countdowns=await page.locator('.fd-aura-header-counts').count();
   assert.equal(countdowns,1,'Los contadores solo deben mostrarse en el encabezado');
   assert.equal(await page.locator('.fd-aura-timer-summary').count(),0,'Sin temporizadores duplicados junto a frases');
   const picker=page.locator('#fd-aura-clock-style');
   await picker.waitFor();
   const iframe=page.locator('.fd-aura-clock-picker iframe');
   await iframe.waitFor();
   const native=page.frameLocator('.fd-aura-clock-picker iframe');
   await native.locator('.clock-stage').waitFor();
   for(const clock of ['analog:atelier','digital:flip','mechanical:tourbillon','3d:solar','animals:gato']){
    await picker.selectOption(clock);
    if(clock==='digital:flip') {
      const state=await page.evaluate(()=>{
        const f=document.querySelector('.fd-aura-clock-picker iframe');
        const d=f?.contentDocument;
        return {selected:document.querySelector('#fd-aura-clock-style')?.value,storage:localStorage.getItem('fd-aura-clock-choice'),origin:location.origin,iframeOrigin:f?.contentWindow?.location.origin,ready:d?.readyState,active:d?.querySelector('#clockTypeSelector button.active')?.getAttribute('data-clock'),styleButtons:d?.querySelectorAll('#styleSelector button').length,iframeEmbed:d?.body?.className};
      }).catch(e=>({failure:e.message}));
      console.log('AURA_DEBUG_STATE',JSON.stringify(state));
    }
    const [type,style]=clock.split(':');
    const expected=type==='analog'?'#analogClock':type==='digital'?'#digitalClock':type==='orbital'?'#orbitalClock':'#funClock';
    const el=native.locator(expected);
    await el.waitFor({state:'visible',timeout:15000});
    const bounds=await el.boundingBox();
    const frameBox=await iframe.boundingBox();
    assert.ok(bounds&&frameBox,'Motor original con dimensiones visibles');
    assert.ok(bounds.width>=115&&bounds.height>=100,'El reloj nativo se representa completo');
    assert.ok(bounds.x>=frameBox.x-5&&bounds.x+bounds.width<=frameBox.x+frameBox.width+5,'Reloj no se corta horizontalmente: '+clock);
   }
   await picker.selectOption('analog:atelier');
   await page.screenshot({path:`${dir}/aura-esferas-${width}.png`,fullPage:false});
   await page.locator('.fd-aura-clock-picker').screenshot({path:`${dir}/aura-tarjeta-atelier-${width}.png`});
   await picker.selectOption('mechanical:tourbillon');
   await page.waitForTimeout(500);
   await page.locator('.fd-aura-clock-picker').screenshot({path:`${dir}/aura-tarjeta-tourbillon-${width}.png`});
   await picker.selectOption('analog:atelier');
  }
  const boxes=await page.evaluate(()=>{const main=document.querySelector('.fd-main').getBoundingClientRect();const workspace=document.querySelector('.fd-workspace').getBoundingClientRect();return{scroll:document.documentElement.scrollWidth,viewport:innerWidth,mainLeft:main.x,mainWidth:main.width,workspaceLeft:workspace.x};});
  assert.ok(boxes.scroll<=width+1,`Desbordamiento horizontal en ${path} a ${width}: ${boxes.scroll}`);assert.ok(boxes.mainWidth>width*(width>959?.70:.95),`Contenido demasiado estrecho en ${path}`);report.push({width,path,...boxes});await page.screenshot({path:`${dir}/${label}-${width}.png`,fullPage:true});
 }}
 // V7.4: comprobar que una sesión local real sobreviva cambios de ruta.
 await page.setViewportSize({width:1440,height:900});
 await page.goto('http://localhost:8080/login?mode=alta',{waitUntil:'domcontentloaded'});
 await page.locator('input[name="email"]').fill('v74-check-'+Date.now()+'@example.test');
 await page.locator('input[name="password"]').fill('PruebaLocalSeguro2026!');
 await page.locator('button[type="submit"]').click();
 await page.waitForURL('**/registro',{timeout:25000});
 for(const path of ['/','/juegos','/noticias','/catedras','/agenda','/']){
  await page.goto('http://localhost:8080'+path,{waitUntil:'domcontentloaded'});
  await page.locator('.fd-sidebar-account button').filter({hasText:'Salir'}).waitFor({timeout:16000});
 }
 // Vite can invalidate the client entry once while the dev server optimizes.
 // A recovered reload is not a hydration error. Real mismatches stay in the list.
 const unexpected=errors.filter(message=>!message.startsWith('Failed to fetch dynamically imported module:'));
 assert.deepEqual(unexpected,[],'Errores JavaScript de interfaz');await fs.writeFile(`${dir}/layout.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({screens:report.length,errors,report}));
}finally{await browser?.close();try{process.kill(-server.pid,'SIGTERM');}catch{}await fs.writeFile(`${dir}/server.log`,output);}
