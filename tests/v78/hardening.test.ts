import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { allowedOrigins, canonicalRedirect, isHttpUrl, strictSslUrl } from "../../src/lib/origin.ts";
import { isPublicFolder } from "../../src/lib/drive/validation.ts";

test("www y sin www son el mismo portal; otros orígenes no", () => {
  const allowed = allowedOrigins("https://derechounam.com", "https://x.test/");
  assert.deepEqual(allowed, ["https://derechounam.com", "https://www.derechounam.com"]);
  assert.ok(!allowed.includes("https://derechounam.com.evil.test"));
  assert.equal(canonicalRedirect("https://derechounam.com", "https://www.derechounam.com/a?b=1"), "https://derechounam.com/a?b=1");
  assert.equal(canonicalRedirect("https://derechounam.com", "https://derechounam.com/a"), null);
  assert.equal(canonicalRedirect("https://derechounam.com", "https://pnota.vercel.app/"), null);
  assert.equal(canonicalRedirect("https://derechounam.com", "https://www.derechounam.com//evil.test"), "https://derechounam.com//evil.test");
});
test("las ligas guardadas sólo pueden ser web", () => {
  for (const bad of ["javascript:alert(1)", "data:text/html,x", "file:///c:/x", "x"]) assert.equal(isHttpUrl(bad), false);
  assert.ok(isHttpUrl("https://www.unam.mx/"));
});
test("TLS estricto sin tocar el resto de la conexión", () => {
  assert.equal(strictSslUrl("postgres://h/d?sslmode=require&channel_binding=require"), "postgres://h/d?sslmode=verify-full&channel_binding=require");
  assert.equal(strictSslUrl("postgres://h/d?sslmode=disable"), "postgres://h/d?sslmode=disable");
});
test("una carpeta abierta por enlace o dominio se rechaza", () => {
  assert.ok(isPublicFolder([{ type: "user" }, { type: "anyone" }]));
  assert.ok(isPublicFolder([{ type: "domain" }]));
  assert.equal(isPublicFolder([{ type: "user" }]), false);
  assert.equal(isPublicFolder(undefined), false);
});
test("migraciones completas, cupo de ruta y voto protegido", async () => {
  const pg = new PGlite();
  for (const name of readdirSync("migrations").filter((n) => n.endsWith(".sql")).sort()) await pg.exec(readFileSync("migrations/" + name, "utf8"));
  const ride = (await pg.query<{ id: number }>("insert into rides(direction,from_place,to_place,weekday,time_slot,seats,notes,owner_alias,created_by) values('Ida','A','B','Lunes','08:00',1,'n','o','owner') returning id")).rows[0].id;
  const ask = async (u: string) => (await pg.query<{ r: string }>("select portal_reserve_ride($1,$2,$2) r", [ride, u])).rows[0].r;
  assert.equal(await ask("owner"), "own");
  assert.equal(await ask("a"), "ok");
  assert.equal(await ask("a"), "already");
  assert.equal(await ask("b"), "full");
  const poll = (await pg.query<{ id: number }>("insert into activity_polls(title,created_by) values('t','o') returning id")).rows[0].id;
  // Exact upsert text used by the server function, so the test follows the code.
  const source = readFileSync("src/lib/votaciones.ts", "utf8");
  const body = source.slice(source.indexOf("insert into activity_poll_responses"), source.indexOf("returning id", source.indexOf("insert into activity_poll_responses")) + 12);
  const names = ["poll", "name", "key", "mode", "date", "time", "days", "note", "hash"];
  let n = 0;
  const text = body.replace(/\$\{[^}]+\}/g, () => "$" + ++n);
  assert.equal(n, names.length);
  const vote = async (hash: string | null, note: string) => (await pg.query(text, [poll, "Ana", "ana", "flexible", null, null, "", note, hash])).rows.length;
  assert.equal(await vote("h1", "uno"), 1);
  assert.equal(await vote("h2", "intruso"), 0);
  assert.equal(await vote("h1", "dos"), 1);
  await pg.query("update activity_poll_responses set edit_token_hash=null");
  assert.equal(await vote("h1", "antiguo"), 0);
  assert.equal((await pg.query<{ note: string }>("select note from activity_poll_responses")).rows[0].note, "dos");
  await pg.close();
});
