#!/usr/bin/env node
/** Syntax only. This does NOT replace tsc --noEmit, integration tests or a production build. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let ts;
try{ts=require('typescript');}catch{if(process.env.TYPESCRIPT_PATH)ts=require(process.env.TYPESCRIPT_PATH);else throw new Error('Instala las dependencias (npm ci) o define TYPESCRIPT_PATH para el compilador local.');}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=[...walk('src'),...walk('tests')].filter(f=>/\.tsx?$/.test(f)&&!f.endsWith('.d.ts'));
let count=0;
for(const file of files){const source=fs.readFileSync(file,'utf8');const result=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,isolatedModules:true}});for(const d of result.diagnostics??[]){if(d.category!==ts.DiagnosticCategory.Error)continue;count++;console.error(file,ts.flattenDiagnosticMessageText(d.messageText,' '));}}
console.log(`${files.length} archivos TS/TSX comprobados sintácticamente. Errores: ${count}. No es una comprobación de tipos ni una compilación de Vite.`);process.exitCode=count?1:0;
