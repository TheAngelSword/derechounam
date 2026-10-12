import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AURA_STATIONS,AURA_STATION_GENRES } from "../../src/lib/aura/stations.ts";
import { AURA_OBSERVANCES } from "../../src/lib/aura/observances.ts";
test("Aura Crono permite al menos 20 radios y agrupa estaciones",()=>{
 assert.equal(AURA_STATIONS.length,44);
 assert.ok(AURA_STATION_GENRES.includes("Clásica"));
 assert.ok(AURA_STATION_GENRES.includes("Jazz"));
 assert.equal(new Set(AURA_STATIONS.map(s=>s.id)).size,AURA_STATIONS.length);
 for(const s of AURA_STATIONS)assert.ok(s.urls.length && s.urls.every(u=>u.startsWith("https://")));
});
test("Catálogo compacto contiene los estilos del Aura original",()=>{
 const text=readFileSync("src/components/aura-clock-selector.tsx","utf8");
 assert.equal((text.match(/\["(?:analog|digital|orbital|mechanical|animals|3d|tetris|creative):/g)??[]).length,26);
 for(const name of ["esqueleto","tourbillon","astronomico","gato","hamster","jardin","solar","codigo","bloques","retro","baile","arena","paisaje"])assert.ok(text.includes(name));
});
test("El bloque de Inicio ofrece clima por horas y frases cada diez segundos",()=>{
 const text=readFileSync("src/components/aura-home.tsx","utf8");
 assert.match(text,/setPhraseIndex\(i=>\(i\+1\)%phrases.length\),10000/);
 assert.match(text,/hourly=temperature_2m,precipitation_probability,weather_code/);
 assert.match(text,/AURA_STATION_GENRES\.map/);
 assert.match(text,/setHolidays/);
 assert.match(text,/AURA_OBSERVANCES/);
 assert.match(text,/AuraClockSelector/);
});
test("El calendario editorial incluye octubre y noviembre",()=>{
 assert.equal(AURA_OBSERVANCES["10-12"].name,"Día de la Nación Pluricultural");
 assert.ok(AURA_OBSERVANCES["11-02"]);
});
