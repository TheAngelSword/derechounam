import type { EnvLike } from "../personal/hosts.ts";

function vercelEnv(env: EnvLike): string {
  return (env.VERCEL_ENV ?? "").trim().toLowerCase();
}

/** Production needs a stable secret. Preview may use the temporary one. */
export function productionSecretReady(env: EnvLike): boolean {
  const secret = env.BETTER_AUTH_SECRET?.trim() ?? "";
  return vercelEnv(env) !== "production" || secret.length >= 32;
}

/**
 * Vercel preview and production have no writable embedded Postgres. An empty
 * DATABASE_URL there must not fall through to PGLite.
 */
export function deployedWithoutDatabase(env: EnvLike): boolean {
  const vercel = vercelEnv(env);
  const deployed = vercel === "production" || vercel === "preview";
  return deployed && !(env.DATABASE_URL ?? "").trim();
}

export type AuthBlock = "secret" | "database";

/** Why `/api/auth` must answer 503, or null when the endpoint can run. */
export function authBlockReason(env: EnvLike): AuthBlock | null {
  if (!productionSecretReady(env)) return "secret";
  if (deployedWithoutDatabase(env)) return "database";
  return null;
}

const globalWarn = globalThis as typeof globalThis & { __authDatabaseWarned?: boolean };

export function warnMissingDeployDatabase(env: EnvLike = process.env): void {
  if (!deployedWithoutDatabase(env) || globalWarn.__authDatabaseWarned) return;
  globalWarn.__authDatabaseWarned = true;
  console.error(
    `[auth] DATABASE_URL no está definida (VERCEL_ENV=${vercelEnv(env) || "vacío"}). El inicio de sesión responde 503. No se arranca PGLite.`,
  );
}
