/** Portal half of the VPS file server: it signs what the browser may do there. */
import { signToken, verifyToken } from "../../../vps-archivos/token.mjs";

const UPLOAD_TTL = 6 * 60 * 60 * 1000; // Long enough for a 512 MB video on a slow connection.
const DOWNLOAD_TTL = 10 * 60 * 1000;

export function vpsConfig(): { url: string; secret: string } | null {
  const raw = process.env.ARCHIVOS_URL?.trim(), secret = process.env.ARCHIVOS_SECRET?.trim();
  if (!raw || !secret || secret.length < 32) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return null;
    return { url: url.origin, secret };
  } catch {
    return null;
  }
}

export function vpsUploadUrl(cfg: { url: string; secret: string }, grant: { id: string; size: number; mime: string; cat: string }): string {
  const token = signToken(cfg.secret, { t: "up", ...grant, exp: Date.now() + UPLOAD_TTL });
  return `${cfg.url}/u/${grant.id}?token=${encodeURIComponent(token)}`;
}

export function vpsDownloadUrl(cfg: { url: string; secret: string }, id: string, name: string, inline: boolean): string {
  const token = signToken(cfg.secret, { t: "dl", id, name, inline, exp: Date.now() + DOWNLOAD_TTL });
  return `${cfg.url}/f/${id}?token=${encodeURIComponent(token)}`;
}

/** The VPS signs a receipt only after the last byte is on disk with the granted size. */
export function vpsReceiptMatches(cfg: { secret: string }, receipt: string, id: string, size: number): boolean {
  const payload = verifyToken(cfg.secret, receipt, "rc") as { id?: string; size?: number } | null;
  return Boolean(payload && payload.id === id && payload.size === size);
}

export async function vpsHealth(cfg: { url: string; secret: string }): Promise<{ freeBytes: number; totalBytes: number }> {
  const token = signToken(cfg.secret, { t: "hc", exp: Date.now() + 60_000 });
  const response = await fetch(`${cfg.url}/health?token=${encodeURIComponent(token)}`, { signal: AbortSignal.timeout(10_000), redirect: "error" });
  const data = (await response.json().catch(() => ({}))) as { ok?: boolean; freeBytes?: number; totalBytes?: number };
  if (!response.ok || !data.ok || typeof data.freeBytes !== "number") throw new Error("El servidor de archivos no respondió correctamente.");
  return { freeBytes: data.freeBytes, totalBytes: data.totalBytes ?? 0 };
}
