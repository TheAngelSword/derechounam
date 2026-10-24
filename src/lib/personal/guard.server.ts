import { getSql } from "@/lib/db";
import { ownerDecisionFromEnv } from "./owner";
import { requestIsPersonal } from "./request.server";

export class PersonalNotFound extends Error {
  readonly status = 404;
  constructor() {
    super("No encontrado.");
    this.name = "PersonalNotFound";
  }
}

async function emailFor(userId: string): Promise<string | null> {
  if (userId === "dev-user") return null;
  const sql = await getSql();
  const rows = await sql<{ email: string }>`select email from "user" where id=${userId} limit 1`;
  return rows[0]?.email ?? null;
}

/** On pnota.com every authenticated server function belongs to the owner. Elsewhere this is a no-op. */
export async function assertPersonalSiteAllowsUser(userId: string): Promise<void> {
  if (!requestIsPersonal()) return;
  const email = await emailFor(userId);
  if (ownerDecisionFromEnv(userId, email, process.env) !== "owner") {
    const { UnauthorizedError } = await import("@/lib/auth/verify.server");
    throw new UnauthorizedError();
  }
}

export async function requirePersonalSite(): Promise<void> {
  if (!requestIsPersonal()) throw new PersonalNotFound();
}

export async function accessState(bearerToken?: string): Promise<{ personal: boolean; state: "off" | "anonymous" | "denied" | "owner" }> {
  if (!requestIsPersonal()) return { personal: false, state: "off" };
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const { authConfigured } = await import("@/lib/auth/verify.server");
  const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());
  if (!authConfigured && !databaseConfigured) {
    const decision = ownerDecisionFromEnv("dev-user", null, process.env);
    return { personal: true, state: decision === "owner" ? "owner" : "denied" };
  }
  const user = await getSessionUser(bearerToken);
  if (!user) return { personal: true, state: "anonymous" };
  const email = user.email ?? await emailFor(user.id);
  return { personal: true, state: ownerDecisionFromEnv(user.id, email, process.env) === "owner" ? "owner" : "denied" };
}
