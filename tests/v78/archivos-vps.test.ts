import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";

const SECRET = "prueba-local-archivos-0123456789abcdef";
const DATA = await mkdtemp(join(tmpdir(), "archivos-"));
Object.assign(process.env, { ARCHIVOS_SECRET: SECRET, ARCHIVOS_DATA: DATA, ARCHIVOS_NO_LISTEN: "1", ALLOWED_ORIGINS: "https://derechounam.com", ARCHIVOS_URL: "http://127.0.0.1:1" });
const { server } = await import("../../vps-archivos/server.mjs");
const { signToken, verifyToken } = await import("../../vps-archivos/token.mjs");
const portal = await import("../../src/lib/storage/vps.server.ts");
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
const cfg = { url: base, secret: SECRET };
test.after(async () => { server.close(); await rm(DATA, { recursive: true, force: true }); });

const id = "0a1b2c3d-1111-4222-8333-444455556666";
const bytes = Buffer.from("A".repeat(10_000) + "B".repeat(5_000));
const upUrl = portal.vpsUploadUrl(cfg, { id, size: bytes.length, mime: "application/pdf", cat: "biblioteca" });
const put = (offset: number, chunk: Buffer, url = upUrl) => fetch(url, { method: "PUT", headers: { "Upload-Offset": String(offset), "Content-Type": "application/pdf" }, body: chunk });

test("tokens: firma, tipo y caducidad", () => {
  const t = signToken(SECRET, { t: "dl", id, exp: Date.now() + 1000 });
  assert.ok(verifyToken(SECRET, t, "dl"));
  assert.equal(verifyToken(SECRET, t, "up"), null);
  assert.equal(verifyToken("otra-clave-de-32-caracteres-xxxxxxxx", t, "dl"), null);
  assert.equal(verifyToken(SECRET, t.slice(0, -2) + "xx", "dl"), null);
  assert.equal(verifyToken(SECRET, signToken(SECRET, { t: "dl", id, exp: Date.now() - 1 }), "dl"), null);
});

test("subida por bloques, reanudación, recibo y descarga con rango", async () => {
  assert.equal((await put(0, bytes, `${base}/u/${id}?token=malo`)).status, 403);
  let r = await put(0, bytes.subarray(0, 10_000));
  assert.equal(r.status, 200); assert.equal(r.headers.get("upload-offset"), "10000");
  r = await put(0, bytes.subarray(0, 10_000));
  assert.equal(r.status, 409, "un bloque repetido no se agrega dos veces");
  const head = await fetch(upUrl, { method: "HEAD" });
  assert.equal(head.headers.get("upload-offset"), "10000");
  assert.equal((await put(10_000, Buffer.alloc(6_000))).status, 400, "no puede exceder el tamaño autorizado");
  r = await put(10_000, bytes.subarray(10_000));
  const done = await r.json() as { complete: boolean; receipt: string };
  assert.ok(done.complete);
  assert.ok(portal.vpsReceiptMatches(cfg, done.receipt, id, bytes.length));
  assert.equal(portal.vpsReceiptMatches(cfg, done.receipt, id, bytes.length + 1), false);
  assert.equal(portal.vpsReceiptMatches(cfg, done.receipt, "0a1b2c3d-1111-4222-8333-444455556667", bytes.length), false);
  // Repeating after completion returns the same receipt instead of corrupting the file.
  assert.ok(((await (await put(0, bytes.subarray(0, 10))).json()) as { receipt?: string }).receipt);

  const dl = portal.vpsDownloadUrl(cfg, id, "Código civil.pdf", true);
  const full = await fetch(dl);
  assert.equal(full.status, 200);
  assert.deepEqual(Buffer.from(await full.arrayBuffer()), bytes);
  assert.match(full.headers.get("content-disposition") ?? "", /^inline; filename\*=UTF-8''C%C3%B3digo%20civil\.pdf$/);
  assert.equal(full.headers.get("content-security-policy"), "sandbox");
  const part = await fetch(dl, { headers: { Range: "bytes=9998-10001" } });
  assert.equal(part.status, 206); assert.equal(await part.text(), "AABB");
  assert.equal((await fetch(dl, { headers: { Range: "bytes=99999-" } })).status, 416);
  assert.equal((await fetch(`${base}/f/${id}?token=${encodeURIComponent(upUrl.split("token=")[1])}`)).status, 403, "un permiso de subida no sirve para descargar");
  assert.equal((await fetch(`${base}/f/${id}`)).status, 403);
  assert.ok(!(await readdir(join(DATA, id.slice(0, 2)))).some((n) => n.endsWith(".part")));
});

test("CORS sólo para el portal y salud con detalle firmado", async () => {
  const ok = await fetch(upUrl, { method: "OPTIONS", headers: { Origin: "https://derechounam.com" } });
  assert.equal(ok.headers.get("access-control-allow-origin"), "https://derechounam.com");
  const bad = await fetch(upUrl, { method: "OPTIONS", headers: { Origin: "https://evil.test" } });
  assert.equal(bad.headers.get("access-control-allow-origin"), null);
  assert.deepEqual(await (await fetch(`${base}/health`)).json(), { ok: true });
  const h = await portal.vpsHealth(cfg);
  assert.ok(h.freeBytes > 0);
  assert.equal((await fetch(`${base}/u/../etc/passwd`)).status, 404);
});

test("el portal no acepta configuración insegura", () => {
  const prev = { ...process.env };
  process.env.ARCHIVOS_URL = "http://archivos.example.com"; assert.equal(portal.vpsConfig(), null);
  process.env.ARCHIVOS_URL = "https://archivos.derechounam.com"; process.env.ARCHIVOS_SECRET = "corta"; assert.equal(portal.vpsConfig(), null);
  process.env.ARCHIVOS_SECRET = SECRET; assert.equal(portal.vpsConfig()?.url, "https://archivos.derechounam.com");
  Object.assign(process.env, prev);
});
