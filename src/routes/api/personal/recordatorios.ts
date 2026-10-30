import { createFileRoute } from "@tanstack/react-router";

async function respond(request: Request): Promise<Response> {
  const { cronResponse } = await import("@/lib/personal/http.server");
  return cronResponse(request);
}

export const Route = createFileRoute("/api/personal/recordatorios")({
  server: { handlers: { GET: ({ request }) => respond(request), POST: ({ request }) => respond(request) } },
});
