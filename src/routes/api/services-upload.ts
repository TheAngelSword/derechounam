import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/services-upload")({
  server: {
    handlers: {
      POST: async () => Response.json(
        { error: "Endpoint retirado. Atrio ahora guarda los archivos en media.ge01.com." },
        { status: 410 },
      ),
    },
  },
});
