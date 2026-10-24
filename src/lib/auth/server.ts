/**
 * Self-hosted Better Auth for Faculta de Derecho (server-only).
 *
 * Production authentication is persisted in PostgreSQL. Email/password is
 * enabled locally and Google OAuth can be enabled with GOOGLE_CLIENT_ID and
 * GOOGLE_CLIENT_SECRET. The public origin comes from BETTER_AUTH_URL.
 */
import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db";
import { emailAndPasswordEnabled } from "./email-password";
import { GATE_PROVIDER_ID, gateIdentitySessions } from "./gate-session.server";
import { pgliteDialect } from "./pglite-dialect";
import { PREVIEW_ALLOWED_HOSTS } from "./preview";

void ensureDbReady();

const globalAuthRef = globalThis as typeof globalThis & {
  __facultaAuthPreviewSecret__?: string;
};
function previewAuthSecret(): string {
  globalAuthRef.__facultaAuthPreviewSecret__ ??= randomBytes(32).toString("hex");
  return globalAuthRef.__facultaAuthPreviewSecret__;
}

const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

const authDisabled = env("VITE_AUTH_ENABLED") === "false";
const googleClientId = env("GOOGLE_CLIENT_ID");
const googleClientSecret = env("GOOGLE_CLIENT_SECRET");
const googleConfigured = Boolean(googleClientId && googleClientSecret);

/** True when at least one real authentication method is available. */
export const authConfigured =
  !authDisabled && (emailAndPasswordEnabled || googleConfigured);

const vercelEnvironment = env("VERCEL_ENV");
const configuredBaseURL = env("BETTER_AUTH_URL");
// A Preview branch must not inherit the public production origin for its cookies.
const explicitBaseURL = vercelEnvironment === "preview" ? undefined : configuredBaseURL;
const vercelBranchUrl = env("VERCEL_BRANCH_URL");
const publicHostname = env("VITE_PUBLIC_HOSTNAME");
const vercelUrl = env("VERCEL_URL");
const vercelProductionUrl = env("VERCEL_PROJECT_PRODUCTION_URL");
const previewAllowedHosts: string[] = [...PREVIEW_ALLOWED_HOSTS];
const isProduction = env("NODE_ENV") === "production";
const LOCAL_DEV_ORIGINS: string[] = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
];

function originFrom(value?: string): string | null {
  if (!value) return null;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

function wwwVariants(value?: string): string[] {
  const origin = originFrom(value);
  if (!origin) return [];
  const url = new URL(origin);
  const hosts = new Set<string>([url.hostname]);
  if (url.hostname.startsWith("www.")) hosts.add(url.hostname.slice(4));
  else hosts.add(`www.${url.hostname}`);
  return [...hosts].map((host) => `${url.protocol}//${host}${url.port ? `:${url.port}` : ""}`);
}

const personalPublicUrl = env("PERSONAL_PUBLIC_URL");
const productionOrigins = [
  ...wwwVariants(explicitBaseURL),
  ...wwwVariants(publicHostname),
  ...wwwVariants(personalPublicUrl),
  originFrom(vercelUrl),
  originFrom(vercelBranchUrl),
  originFrom(vercelProductionUrl),
].filter((value): value is string => Boolean(value));

const trustedOrigins: string[] = Array.from(
  new Set([
    ...productionOrigins,
    ...(!isProduction
      ? previewAllowedHosts.flatMap((host) => [`https://${host}`, `http://${host}`])
      : []),
    ...(!isProduction ? LOCAL_DEV_ORIGINS : []),
  ]),
);

function hostnamesOf(value?: string): string[] {
  const origin = originFrom(value);
  if (!origin) return [];
  const url = new URL(origin);
  const bare = url.hostname.replace(/^www\./, "");
  return [bare, `www.${bare}`];
}
// One deployment can serve derechounam.com and pnota.com. Cookies stay host-only
// (__Host- forbids a Domain attribute), so each host has its own session.
// Dynamic baseURL is used only when those origins differ. A single-origin
// deployment keeps the previous string baseURL.
const personalOrigin = originFrom(personalPublicUrl);
const portalOrigin = originFrom(explicitBaseURL);
const multiHost = Boolean(personalOrigin && portalOrigin && personalOrigin !== portalOrigin);
const baseURL = !explicitBaseURL || multiHost ? {
  allowedHosts: [
    ...hostnamesOf(explicitBaseURL),
    ...(publicHostname ? hostnamesOf(publicHostname) : []),
    ...hostnamesOf(personalPublicUrl),
    ...(vercelUrl ? [vercelUrl] : []),
    ...(vercelBranchUrl ? [vercelBranchUrl] : []),
    ...(vercelProductionUrl ? [vercelProductionUrl] : []),
    ...(!isProduction ? previewAllowedHosts : []),
    ...(!isProduction ? ["localhost", "127.0.0.1", "[::1]"] : []),
  ],
  protocol: (isProduction ? "https" : "auto") as "https" | "auto",
  fallback: portalOrigin ?? personalOrigin ?? originFrom(vercelBranchUrl) ?? originFrom(vercelUrl) ?? originFrom(publicHostname) ?? "http://localhost:8080",
} : explicitBaseURL;

const databaseUrl = env("DATABASE_URL");
const database = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

export const SESSION_TOKEN_COOKIE = "__Host-faculta-auth.session_token";

const stableAuthSecret = env("BETTER_AUTH_SECRET");
/**
 * Never crash public SSR pages because an auth secret has not been configured.
 * Auth endpoints fail closed with 503 until Production gets a stable secret.
 * A temporary secret below is used only for constructing the unused Better Auth
 * instance; with authSecretReady=false no public auth endpoint can use it.
 */
export const authSecretReady =
  env("VERCEL_ENV") !== "production" ||
  Boolean(stableAuthSecret && stableAuthSecret.length >= 32);
if (!authSecretReady) {
  console.error("[auth] Configuración incompleta: BETTER_AUTH_SECRET de Production debe tener al menos 32 caracteres. Autenticación suspendida; páginas públicas disponibles.");
}
export const auth = betterAuth({
  baseURL,
  secret: stableAuthSecret ?? previewAuthSecret(),
  database,
  trustedOrigins,

  ...(googleConfigured
    ? {
        socialProviders: {
          google: {
            clientId: googleClientId as string,
            clientSecret: googleClientSecret as string,
            prompt: "select_account",
          },
        },
      }
    : {}),

  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", GATE_PROVIDER_ID],
      requireLocalEmailVerified: false,
    },
  },

  session: { cookieCache: { enabled: true, maxAge: 300 } },
  ...(emailAndPasswordEnabled ? { emailAndPassword: { enabled: true } } : {}),

  advanced: {
    // __Host- cookies cannot set Domain. pnota.com and derechounam.com do not share a session.
    useSecureCookies: false,
    defaultCookieAttributes: { secure: true, sameSite: "lax", path: "/" },
    cookies: {
      session_token: { name: SESSION_TOKEN_COOKIE },
      session_data: { name: "__Host-faculta-auth.session_data" },
      account_data: { name: "__Host-faculta-auth.account_data" },
      dont_remember: { name: "__Host-faculta-auth.dont_remember" },
    },
  },

  plugins: [
    gateIdentitySessions(),
    bearer(),
    tanstackStartCookies(),
  ],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}

export { AUTH_PROVIDERS, GROK_PROVIDERS } from "./providers";
