/** Host routing for pnota.com. Pure: no I/O, safe in tests and in the browser. */

export type EnvLike = Record<string, string | undefined>;

export const PORTAL_PAGES = [
  "/noticias",
  "/juegos",
  "/plan-estudios",
  "/clases",
  "/catedras",
  "/tareas",
  "/biblioteca",
  "/agenda",
  "/votaciones",
  "/bitacora",
  "/mesas",
  "/mural",
  "/servicios",
  "/rutas",
  "/registro",
  "/control",
] as const;

export function originOf(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const raw = value.trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function hostnameOf(value: string | undefined): string | null {
  const origin = originOf(value);
  return origin ? new URL(origin).hostname.toLowerCase() : null;
}

/** First host in a header, without port. Rejects values that are not a host. */
export function hostFromHeader(value: string | null | undefined): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!first || /[\s/]/.test(first)) return null;
  if (first.startsWith("[")) {
    const end = first.indexOf("]");
    return end > 1 ? first.slice(0, end + 1) : null;
  }
  return first.replace(/:\d+$/, "");
}

export function personalHostnames(env: EnvLike): string[] {
  const host = hostnameOf(env.PERSONAL_PUBLIC_URL);
  if (!host) return [];
  const bare = host.startsWith("www.") ? host.slice(4) : host;
  return bare ? [bare, `www.${bare}`] : [];
}

/**
 * True when this request should render the private space.
 * `SITE_MODE=personal` is a deployment that only serves pnota.com.
 * Otherwise the host must match `PERSONAL_PUBLIC_URL` (apex or www).
 */
export function isPersonalSite(hostHeader: string | null | undefined, env: EnvLike): boolean {
  if ((env.SITE_MODE ?? "").trim().toLowerCase() === "personal") return true;
  const host = hostFromHeader(hostHeader);
  if (!host) return false;
  return personalHostnames(env).includes(host);
}

export function portalOrigin(env: EnvLike): string | null {
  return originOf(env.PORTAL_PUBLIC_URL);
}

export function isPortalPage(pathname: string): boolean {
  const path = pathname.split("?")[0]?.replace(/\/+$/, "") || "/";
  return PORTAL_PAGES.some((page) => path === page || path.startsWith(`${page}/`));
}

export function isProductionEnv(env: EnvLike): boolean {
  return env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
}
