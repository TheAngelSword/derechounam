// Signed, expiring capabilities shared by the portal (Vercel) and the file server (VPS).
// No dependencies: the same file runs in both places.
import { createHmac, timingSafeEqual } from "node:crypto";

const b64 = (value) => Buffer.from(value).toString("base64url");

/** Token = base64url(JSON payload) + "." + base64url(HMAC-SHA256). */
export function signToken(secret, payload) {
  if (!secret || secret.length < 32) throw new Error("ARCHIVOS_SECRET debe tener al menos 32 caracteres.");
  const body = b64(JSON.stringify(payload));
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
}

/** Returns the payload, or null when the signature, type or expiry does not match. */
export function verifyToken(secret, token, type, now = Date.now()) {
  if (!secret || typeof token !== "string" || token.length > 4096) return null;
  const [body, mac, extra] = token.split(".");
  if (!body || !mac || extra !== undefined) return null;
  const expected = createHmac("sha256", secret).update(body).digest();
  let given;
  try { given = Buffer.from(mac, "base64url"); } catch { return null; }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")); } catch { return null; }
  if (!payload || payload.t !== type) return null;
  if (typeof payload.exp === "number" && payload.exp < now) return null;
  return payload;
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
