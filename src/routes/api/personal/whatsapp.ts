import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/personal/whatsapp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { whatsappGet } = await import("@/lib/personal/http.server");
        return whatsappGet(request);
      },
      POST: async ({ request }) => {
        const { whatsappPost } = await import("@/lib/personal/http.server");
        return whatsappPost(request);
      },
    },
  },
});
