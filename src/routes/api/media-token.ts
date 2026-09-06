import { createFileRoute } from "@tanstack/react-router";
import { createHmac, randomUUID } from "node:crypto";
import { auth } from "@/lib/auth/server";
import { getSql } from "@/lib/db";

const CATEGORY_LIMITS = {
  biblioteca: 100 * 1024 * 1024,
  bitacora: 20 * 1024 * 1024,
  catedras: 40 * 1024 * 1024,
  servicios: 15 * 1024 * 1024,
} as const;

type Category = keyof typeof CATEGORY_LIMITS;

function b64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function cleanSubfolder(value: unknown) {
  const text = String(value ?? "").trim().replace(/\\/g, "/");
  if (!text) return "";
  const parts = text
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").slice(0, 50))
    .filter(Boolean)
    .slice(0, 4);
  return parts.join("/");
}

async function requireActiveMember(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) throw new Error("Debes iniciar sesión.");
  const sql = await getSql();
  const rows = await sql<{ status: string }>`select status from members where user_id = ${userId} limit 1`;
  if (!rows[0] || rows[0].status !== "activo") throw new Error("Tu usuario debe estar activo en el padrón.");
  return userId;
}

export const Route = createFileRoute("/api/media-token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await requireActiveMember(request);
          const secret = process.env.ATRIO_MEDIA_UPLOAD_SECRET?.trim();
          if (!secret || secret.length < 32) {
            throw new Error("Falta configurar ATRIO_MEDIA_UPLOAD_SECRET en Vercel.");
          }

          const body = (await request.json()) as {
            category?: string;
            subfolder?: string;
            fileName?: string;
            contentType?: string;
            size?: number;
          };
          const category = body.category as Category;
          if (!(category in CATEGORY_LIMITS)) throw new Error("Categoría de archivo no permitida.");

          const size = Number(body.size ?? 0);
          if (!Number.isFinite(size) || size <= 0 || size > CATEGORY_LIMITS[category]) {
            throw new Error("El archivo supera el límite permitido para esta sección.");
          }

          const payload = {
            v: 1,
            jti: randomUUID(),
            exp: Math.floor(Date.now() / 1000) + 10 * 60,
            category,
            subfolder: cleanSubfolder(body.subfolder),
            fileName: String(body.fileName ?? "archivo").slice(0, 220),
            contentType: String(body.contentType ?? "application/octet-stream").slice(0, 120),
            maxBytes: CATEGORY_LIMITS[category],
          };
          const encoded = b64url(JSON.stringify(payload));
          const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
          const uploadUrl = process.env.ATRIO_MEDIA_UPLOAD_URL?.trim() || "https://media.ge01.com/_upload/upload.php";

          return Response.json({ token: `${encoded}.${signature}`, uploadUrl });
        } catch (error) {
          const message = error instanceof Error ? error.message : "No se pudo autorizar la subida.";
          return Response.json({ error: message }, { status: /sesión|padrón/i.test(message) ? 401 : 400 });
        }
      },
    },
  },
});
