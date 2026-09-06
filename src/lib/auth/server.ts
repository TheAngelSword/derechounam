/**
 * Self-hosted Better Auth for Atrio (server-only).
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
  __atrioAuthPreviewSecret__?: string;
};
function previewAuthSecret(): string {
  globalAuthRef.__atrioAuthPreviewSecret__ ??= randomBytes(32).toString("hex");
  return globalAuthRef.__atrioAuthPreviewSecret__;
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

const explicitBaseURL = env("BETTER_AUTH_URL");
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

const productionOrigins = [
  ...wwwVariants(explicitBaseURL),
  ...wwwVariants(publicHostname),
  originFrom(vercelUrl),
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

const baseURL = explicitBaseURL ?? {
  allowedHosts: [
    ...(publicHostname ? [publicHostname, `www.${publicHostname.replace(/^www\./, "")}`] : []),
    ...(vercelUrl ? [vercelUrl] : []),
    ...(vercelProductionUrl ? [vercelProductionUrl] : []),
    ...(!isProduction ? previewAllowedHosts : []),
    ...(!isProduction ? ["localhost", "127.0.0.1", "[::1]"] : []),
  ],
  protocol: "auto" as const,
  fallback: originFrom(publicHostname) ?? "http://localhost:8080",
};

const databaseUrl = env("DATABASE_URL");
const database = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

export const SESSION_TOKEN_COOKIE = "__Host-atrio-auth.session_token";

export const auth = betterAuth({
  baseURL,
  secret: env("BETTER_AUTH_SECRET") ?? previewAuthSecret(),
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
    useSecureCookies: false,
    defaultCookieAttributes: { secure: true, sameSite: "lax", path: "/" },
    cookies: {
      session_token: { name: SESSION_TOKEN_COOKIE },
      session_data: { name: "__Host-atrio-auth.session_data" },
      account_data: { name: "__Host-atrio-auth.account_data" },
      dont_remember: { name: "__Host-atrio-auth.dont_remember" },
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
