import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { authBlockReason, warnMissingDeployDatabase } from "@/lib/auth/database-guard";
import { passwordResetConfigured, personalResetAllowed, RESET_PUBLIC_MESSAGE } from "@/lib/auth/password-mail";

const noStore = { "Cache-Control": "no-store" };

function unavailable(code: string, message: string): Response {
  return Response.json({ code, message }, { status: 503, headers: noStore });
}

async function maskedPersonalReset(request: Request): Promise<Response | null> {
  if (request.method !== "POST" || !passwordResetConfigured(process.env)) return null;
  const path = new URL(request.url).pathname;
  if (!path.endsWith("/request-password-reset")) return null;
  let email = "";
  try {
    const body = await request.clone().json() as { email?: unknown };
    email = typeof body.email === "string" ? body.email : "";
  } catch {
    return null;
  }
  const { requestIsPersonal } = await import("@/lib/personal/request.server");
  if (!requestIsPersonal() || personalResetAllowed(email, process.env, true)) return null;
  return Response.json({ status: true, message: RESET_PUBLIC_MESSAGE }, { status: 200, headers: noStore });
}

async function handleAuth(request: Request): Promise<Response> {
  const block = authBlockReason(process.env);
  if (block === "secret") {
    return unavailable("AUTH_UNAVAILABLE", "El inicio de sesión está temporalmente fuera de servicio.");
  }
  if (block === "database") {
    warnMissingDeployDatabase();
    return unavailable("DATABASE_UNAVAILABLE", "El inicio de sesión necesita DATABASE_URL en este despliegue. No se usa la base embebida.");
  }
  const masked = await maskedPersonalReset(request);
  if (masked) return masked;
  return auth.handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuth(request),
      POST: ({ request }) => handleAuth(request),
    },
  },
});
