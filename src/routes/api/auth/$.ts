import { createFileRoute } from "@tanstack/react-router";
import { auth, authSecretReady } from "@/lib/auth/server";

function handleAuth(request: Request): Promise<Response> | Response {
  if (!authSecretReady) return Response.json({code:"AUTH_UNAVAILABLE",message:"El inicio de sesión está temporalmente fuera de servicio."},{status:503,headers:{"Cache-Control":"no-store"}});
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
