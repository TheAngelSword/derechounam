import { createFileRoute } from "@tanstack/react-router";

async function respond(request: Request): Promise<Response> {
  const { icsResponse } = await import("@/lib/personal/http.server");
  return icsResponse(request);
}

export const Route = createFileRoute("/api/personal/calendario.ics")({
  server: { handlers: { GET: ({ request }) => respond(request) } },
});
