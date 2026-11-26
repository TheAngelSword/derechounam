// Archivos de Facultad de Derecho: stores uploads on the VPS disk.
// The portal decides who may upload or read; this server only honours its signed tokens.
import { createServer } from "node:http";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, open, rename, stat, statfs, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { signToken, verifyToken, UUID } from "./token.mjs";

const SECRET = process.env.ARCHIVOS_SECRET ?? "";
const DATA = process.env.ARCHIVOS_DATA ?? "/data";
const PORT = Number(process.env.PORT ?? 8795);
const ORIGINS = new Set((process.env.ALLOWED_ORIGINS ?? "").split(",").map((v) => v.trim()).filter(Boolean));
const MAX_CHUNK = 16 * 1024 * 1024;
const RESERVE = 5 * 1024 ** 3; // Keep 5 GiB free for the other services on this machine.
if (SECRET.length < 32) { console.error("ARCHIVOS_SECRET falta o es corto."); process.exit(1); }

const busy = new Set();
const dirOf = (id) => join(DATA, id.slice(0, 2));
const paths = (id) => ({ part: join(dirOf(id), `${id}.part`), file: join(dirOf(id), id), meta: join(dirOf(id), `${id}.json`) });
const sizeOf = async (path) => { try { return (await stat(path)).size; } catch { return -1; } };

function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "PUT, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Upload-Offset");
    res.setHeader("Access-Control-Expose-Headers", "Upload-Offset");
    res.setHeader("Access-Control-Max-Age", "600");
  }
}
function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers, ...(body === undefined ? {} : { "Content-Type": "application/json" }) });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}
const receipt = (id, size) => signToken(SECRET, { t: "rc", id, size });

async function upload(req, res, id, token) {
  const grant = verifyToken(SECRET, token, "up");
  if (!grant || grant.id !== id || !Number.isSafeInteger(grant.size) || grant.size <= 0) return send(res, 403, { error: "Permiso de subida no válido o vencido." });
  const p = paths(id);
  const done = await sizeOf(p.file);
  if (done === grant.size) return send(res, 200, { complete: true, offset: done, receipt: receipt(id, done) }, { "Upload-Offset": String(done) });
  const offset = Math.max(0, await sizeOf(p.part));
  if (req.method === "HEAD") return send(res, 200, undefined, { "Upload-Offset": String(offset) });
  const claimed = Number(req.headers["upload-offset"]);
  const length = Number(req.headers["content-length"]);
  if (claimed !== offset) return send(res, 409, { error: "Desfase de bloque.", offset }, { "Upload-Offset": String(offset) });
  if (!Number.isSafeInteger(length) || length <= 0 || length > MAX_CHUNK || offset + length > grant.size) return send(res, 400, { error: "Tamaño de bloque no válido." });
  if (busy.has(id)) return send(res, 409, { error: "Ya hay un bloque en curso.", offset }, { "Upload-Offset": String(offset) });
  if (offset === 0) {
    const fs = await statfs(DATA);
    if (fs.bavail * fs.bsize < grant.size + RESERVE) return send(res, 507, { error: "El servidor de archivos no tiene espacio suficiente." });
    await mkdir(dirOf(id), { recursive: true });
  }
  busy.add(id);
  try {
    let received = 0;
    const out = createWriteStream(p.part, { flags: "a" });
    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => { received += chunk.length; if (received > length) { req.destroy(); reject(new Error("too long")); } });
      req.on("aborted", () => reject(new Error("aborted")));
      req.pipe(out);
      out.on("finish", resolve);
      out.on("error", reject);
    });
    const now = await sizeOf(p.part);
    if (received !== length || now !== offset + length) {
      // Cut back to the last whole block so a retry can resume cleanly.
      const handle = await open(p.part, "r+"); await handle.truncate(offset); await handle.close();
      return send(res, 400, { error: "El bloque llegó incompleto.", offset }, { "Upload-Offset": String(offset) });
    }
    if (now < grant.size) return send(res, 200, { complete: false, offset: now }, { "Upload-Offset": String(now) });
    await writeFile(p.meta, JSON.stringify({ mime: grant.mime, size: now, category: grant.cat, created: new Date().toISOString() }));
    await rename(p.part, p.file);
    return send(res, 200, { complete: true, offset: now, receipt: receipt(id, now) }, { "Upload-Offset": String(now) });
  } catch {
    const now = await sizeOf(p.part);
    if (now > offset) { const handle = await open(p.part, "r+"); await handle.truncate(offset); await handle.close(); }
    if (!res.headersSent) send(res, 400, { error: "Se interrumpió el bloque.", offset }, { "Upload-Offset": String(offset) });
  } finally { busy.delete(id); }
}

async function download(req, res, id, token, query) {
  const grant = verifyToken(SECRET, token, "dl");
  if (!grant || grant.id !== id) return send(res, 403, { error: "Enlace vencido. Vuelve a abrir el archivo desde el portal." });
  const p = paths(id);
  let meta;
  try { meta = JSON.parse(await readFile(p.meta, "utf8")); } catch { return send(res, 404, { error: "Archivo no encontrado." }); }
  const size = await sizeOf(p.file);
  if (size < 0) return send(res, 404, { error: "Archivo no encontrado." });
  const name = typeof grant.name === "string" ? grant.name : id;
  const headers = {
    "Content-Type": meta.mime || "application/octet-stream",
    "Content-Disposition": `${grant.inline && !query.has("download") ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(name)}`,
    "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=600", "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "sandbox", "Referrer-Policy": "no-referrer", "Cross-Origin-Resource-Policy": "cross-origin",
  };
  let start = 0, end = size - 1, status = 200;
  const range = req.headers.range;
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!m || (!m[1] && !m[2])) { res.writeHead(416, { "Content-Range": `bytes */${size}` }); return res.end(); }
    if (m[1]) { start = Number(m[1]); if (m[2]) end = Math.min(Number(m[2]), size - 1); }
    else { start = Math.max(0, size - Number(m[2])); }
    if (start > end || start >= size) { res.writeHead(416, { "Content-Range": `bytes */${size}` }); return res.end(); }
    status = 206; headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
  }
  headers["Content-Length"] = String(end - start + 1);
  res.writeHead(status, headers);
  if (req.method === "HEAD") return res.end();
  createReadStream(p.file, { start, end }).on("error", () => res.destroy()).pipe(res);
}

export const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://archivos");
    cors(req, res);
    if (req.method === "OPTIONS") return send(res, 204);
    if (url.pathname === "/health") {
      const grant = verifyToken(SECRET, url.searchParams.get("token") ?? "", "hc");
      if (!grant) return send(res, 200, { ok: true });
      const fs = await statfs(DATA);
      return send(res, 200, { ok: true, freeBytes: fs.bavail * fs.bsize, totalBytes: fs.blocks * fs.bsize });
    }
    const m = /^\/(u|f)\/([0-9a-f-]{36})$/.exec(url.pathname);
    if (!m || !UUID.test(m[2])) return send(res, 404, { error: "No encontrado." });
    const token = url.searchParams.get("token") ?? "";
    if (m[1] === "u" && (req.method === "PUT" || req.method === "HEAD")) return await upload(req, res, m[2], token);
    if (m[1] === "f" && (req.method === "GET" || req.method === "HEAD")) return await download(req, res, m[2], token, url.searchParams);
    return send(res, 405, { error: "Método no permitido." });
  } catch (error) {
    console.error("[archivos]", error?.message ?? error);
    if (!res.headersSent) send(res, 500, { error: "Error del servidor de archivos." });
    else res.destroy();
  }
});
server.requestTimeout = 600000;

// Tests import the server without listening.
if (process.env.ARCHIVOS_NO_LISTEN !== "1") {
  await mkdir(DATA, { recursive: true });
  server.listen(PORT, "0.0.0.0", () => console.log(`[archivos] escuchando en ${PORT}, datos en ${DATA}`));
}
