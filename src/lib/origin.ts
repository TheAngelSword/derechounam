/** Pure origin helpers, shared by API guards, canonical redirects and tests. */
export function canonicalOrigin(configured: string | undefined, requestUrl: string): string {
  try { if (configured?.trim()) return new URL(configured.trim()).origin; } catch { /* Misconfigured: use the request. */ }
  return new URL(requestUrl).origin;
}
/** The configured origin plus its www / non-www sibling. Nothing else. */
export function allowedOrigins(configured: string | undefined, requestUrl: string): string[] {
  const main = new URL(canonicalOrigin(configured, requestUrl));
  const sibling = new URL(main);
  sibling.hostname = main.hostname.startsWith("www.") ? main.hostname.slice(4) : `www.${main.hostname}`;
  return [main.origin, sibling.origin];
}
/** Where a page must be redirected so both hosts share one session, or null. */
export function canonicalRedirect(configured: string | undefined, requestUrl: string): string | null {
  if (!configured?.trim()) return null;
  const url = new URL(requestUrl);
  const [main, sibling] = allowedOrigins(configured, requestUrl);
  if (url.host === new URL(main).host || url.host !== new URL(sibling).host) return null;
  return main + url.pathname + url.search;
}
/** z.string().url() accepts javascript: and data:. Stored links must be web links. */
export function isHttpUrl(value: string): boolean {
  try { const u = new URL(value); return u.protocol === "https:" || u.protocol === "http:"; } catch { return false; }
}
/** pg treats these modes as verify-full today; state it so a pg upgrade cannot weaken TLS. */
export function strictSslUrl(value: string): string {
  return /[?&]uselibpqcompat=/.test(value) ? value : value.replace(/([?&]sslmode=)(prefer|require|verify-ca)(?=&|$)/, "$1verify-full");
}
