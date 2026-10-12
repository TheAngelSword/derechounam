import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAN_COURSES,PLAN_TOTAL_CREDITS } from '../../src/lib/study/plan.ts';
import { validateProgress,summarizeProgress,missingPrerequisites,type StudyProgress } from '../../src/lib/study/progress.ts';
const required=PLAN_COURSES.filter(c=>c.kind==='obligatoria'),optional=PLAN_COURSES.filter(c=>c.kind==='optativa');
test('plan 2125: 51 obligatorias, 87 opciones, 366+84 créditos',()=>{assert.equal(required.length,51);assert.equal(optional.length,87);assert.equal(required.reduce((n,c)=>n+c.credits,0),366);assert.equal(optional.every(c=>c.credits===7),true);assert.equal(366+12*7,PLAN_TOTAL_CREDITS);});
test('distribución oficial de obligatorias en ocho semestres',()=>assert.deepEqual(Array.from({length:8},(_,i)=>required.filter(c=>c.semester===i+1).length),[7,7,6,6,6,7,6,6]));
test('IDs únicos y seriación referida sólo a materias existentes',()=>{assert.equal(new Set(PLAN_COURSES.map(c=>c.id)).size,138);for(const c of required)for(const id of c.prerequisites)assert.ok(required.some(p=>p.id===id));});
test('las claves optativas no verificadas no se inventan',()=>assert.ok(optional.every(c=>c.code===null)));
test('avance vacío es cero; todas las requeridas suman 366, no 450',()=>{assert.equal(summarizeProgress({}).credits,0);const p=Object.fromEntries(required.map(c=>[c.id,{status:'aprobada'}])) as StudyProgress;assert.equal(summarizeProgress(p).credits,366);assert.equal(summarizeProgress(p).percent,81);});
test('seis optativas por semestre y tope de 450',()=>{const p=Object.fromEntries(required.map(c=>[c.id,{status:'aprobada'}])) as StudyProgress;optional.slice(0,12).forEach((c,i)=>p[c.id]={status:'aprobada',semester:i<6?9:10});assert.equal(summarizeProgress(validateProgress(p)).credits,450);p[optional[12].id]={status:'pendiente',semester:9};assert.throws(()=>validateProgress(p),/seis optativas/);});
test('se rechaza ID desconocido, estado falso o semestre de optativa omitido',()=>{assert.throws(()=>validateProgress({inventada:{status:'aprobada'}}));assert.throws(()=>validateProgress({'1121':{status:'robada'}}));assert.throws(()=>validateProgress({[optional[0].id]:{status:'aprobada'}}));});
test('la seriación depende del avance, no de matrícula simulada',()=>{assert.deepEqual(missingPrerequisites('1221',{}),['1121']);assert.deepEqual(missingPrerequisites('1221',{'1121':{status:'aprobada'}}),[]);});

test('las claves obligatorias no visibles permanecen pendientes de confirmación',()=>{const visible=new Set(required.flatMap(c=>c.prerequisites));for(const c of required){if(!visible.has(c.id))assert.equal(c.code,null);else assert.equal(c.code,c.id);}});
