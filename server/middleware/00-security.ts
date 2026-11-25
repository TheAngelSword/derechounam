/** Canonical host redirect and baseline security headers for server responses. */
import { canonicalRedirect } from "../../src/lib/origin";
interface SecurityEvent { url: URL; req: { method: string; headers: Headers } }
const HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Content-Security-Policy": "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
};
export default async function security(event: SecurityEvent, next: () => unknown | Promise<unknown>): Promise<unknown> {
  if (process.env.VERCEL_ENV !== "production") return next();
  const method = event.req.method.toUpperCase();
  const host = event.req.headers.get("x-forwarded-host") ?? event.req.headers.get("host");
  if ((method === "GET" || method === "HEAD") && host && !event.url.pathname.startsWith("/api/auth")) {
    let target: string | null = null;
    try { target = canonicalRedirect(process.env.APP_PUBLIC_URL, `https://${host}${event.url.pathname}${event.url.search}`); } catch { /* Invalid Host header. */ }
    // Temporary on purpose: a cached permanent redirect would outlive a host change.
    if (target) return new Response(null, { status: 307, headers: { Location: target, "Cache-Control": "no-store" } });
  }
  const result = await next();
  if (!(result instanceof Response)) return result;
  const headers = new Headers(result.headers);
  for (const [name, value] of Object.entries(HEADERS)) if (!headers.has(name)) headers.set(name, value);
  return new Response(result.body, { status: result.status, statusText: result.statusText, headers });
}
