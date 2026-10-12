import { GAME_CARDS, GAME_SUBJECTS, type StudyCard } from './bank.ts';
export const GAME_MODES = ['quiz','fichas','memorama','relacionar','verdadero-falso','tablero'] as const;
export type GameMode = typeof GAME_MODES[number];
export function normalizedAnswer(value:string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); }
/** Deterministic Fisher–Yates, seeded only after a user starts a game. */
export function shuffled<T>(items:readonly T[], seed:number):T[] { let s=seed>>>0;const a=[...items];for(let i=a.length-1;i>0;i--){s=(Math.imul(1664525,s)+1013904223)>>>0;const j=s%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a; }
export function quizDeck(cards:StudyCard[],seed:number,count=5){return shuffled(cards,seed).slice(0,Math.min(count,cards.length)).map((card,i)=>({card,options:shuffled([card,...shuffled(cards.filter(c=>c.id!==card.id),seed+i+23).slice(0,3)],seed+i+41)}));}
export function boardAnswer(subjectId:string,value:string){const subject=GAME_SUBJECTS.find(s=>s.id===subjectId);const n=normalizedAnswer(value);if(!n||!subject)return -1;return subject.board.answers.findIndex(([label,aliases])=>[label,...aliases].some(a=>normalizedAnswer(a)===n));}
export type PracticeAnswer={id:string;value:string;comparedId?:string};
export type PracticeAttempt={id:string;subject:string;mode:GameMode;answers:PracticeAnswer[];seconds:number};
/** Practice only, never used as academic credit or an official/competitive score. */
export function gradeAttempt(input:PracticeAttempt){
 const subject=GAME_SUBJECTS.find(s=>s.id===input.subject);if(!subject||!GAME_MODES.includes(input.mode))throw new Error('Actividad no válida.');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id)||!Number.isInteger(input.seconds)||input.seconds<0||input.seconds>86400)throw new Error('Resultado no válido.');
 if(!Array.isArray(input.answers)||input.answers.length<1||input.answers.length>20)throw new Error('Número de respuestas no válido.');
 const unique=new Set<string>();let correct=0;
 for(const a of input.answers){if(typeof a.value!=='string'||a.value.length>300||unique.has(a.id))throw new Error('Respuesta no válida o repetida.');unique.add(a.id);
  if(input.mode==='tablero'){const index=Number(a.id);if(!Number.isInteger(index)||String(index)!==a.id||index<0||index>=subject.board.answers.length)throw new Error('Casilla no válida.');if(boardAnswer(input.subject,a.value)===index)correct++;}
  else{const card=subject.cards.find(c=>c.id===a.id);if(!card)throw new Error('Pregunta ajena a la materia.');if(input.mode==='verdadero-falso'){if(!subject.cards.some(c=>c.id===a.comparedId)||!['verdadero','falso'].includes(a.value))throw new Error('Comparación no válida.');if((a.value==='verdadero')===(a.id===a.comparedId))correct++;}else if(normalizedAnswer(card.term)===normalizedAnswer(a.value))correct++;}
 }
 return {correct,total:input.answers.length,percent:Math.round(correct/input.answers.length*100)};
}
export function cardById(id:string){return GAME_CARDS.find(c=>c.id===id);}
