import { isProductionEnv, type EnvLike } from "./hosts.ts";

export function ownerEmails(raw: string | undefined): string[] {
  const seen = new Set<string>();
  for (const part of (raw ?? "").split(/[,;\s]+/)) {
    const email = part.trim().toLowerCase();
    if (email) seen.add(email);
  }
  return [...seen];
}

export function ownerDecision(input: {
  userId: string;
  email: string | null;
  allowRaw: string | undefined;
  production: boolean;
}): "owner" | "denied" {
  const list = ownerEmails(input.allowRaw);
  if (!list.length) return "denied";
  const email = input.email?.trim().toLowerCase() ?? "";
  if (email && list.includes(email)) return "owner";
  // The shared dev user exists only when auth is off and there is no database.
  // It is never an owner in production, even if someone pastes it into the list.
  if (!input.production && input.userId === "dev-user" && list.includes("dev-user")) return "owner";
  return "denied";
}

export function ownerDecisionFromEnv(
  userId: string,
  email: string | null,
  env: EnvLike,
): "owner" | "denied" {
  return ownerDecision({
    userId,
    email,
    allowRaw: env.PERSONAL_OWNER_EMAILS,
    production: isProductionEnv(env),
  });
}
