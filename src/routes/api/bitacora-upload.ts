import { issueSignedToken } from "@vercel/blob";
import {
  handleUploadPresigned,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { getSql } from "@/lib/db";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function requireActiveMember(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not authorized");

  const sql = await getSql();
  const rows = await sql<{ status: string }>`select status from members where user_id = ${userId} limit 1`;
  if (!rows[0] || rows[0].status !== "activo") throw new Error("Not authorized");
  return userId;
}

export const Route = createFileRoute("/api/bitacora-upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as HandleUploadPresignedBody;

        try {
          const jsonResponse = await handleUploadPresigned({
            body,
            request,
            getSignedToken: async (pathname) => {
              await requireActiveMember(request);
              if (!pathname.startsWith("bitacora/") || pathname.includes("..")) {
                throw new Error("Ruta de archivo no permitida");
              }

              const validUntil = Date.now() + 10 * 60 * 1000;
              const token = await issueSignedToken({
                pathname,
                operations: ["put"],
                allowedContentTypes: IMAGE_CONTENT_TYPES,
                maximumSizeInBytes: MAX_IMAGE_BYTES,
                validUntil,
              });

              return {
                token,
                urlOptions: {
                  allowedContentTypes: IMAGE_CONTENT_TYPES,
                  maximumSizeInBytes: MAX_IMAGE_BYTES,
                  validUntil,
                  addRandomSuffix: true,
                  allowOverwrite: false,
                  cacheControlMaxAge: 60 * 60 * 24 * 7,
                },
              };
            },
          });

          return Response.json(jsonResponse);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return Response.json(
            { error: message },
            { status: message === "Not authorized" ? 401 : 400 },
          );
        }
      },
    },
  },
});
