import { auth } from "@/lib/auth/server";
import { getSql } from "@/lib/db";
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export function assertRequestOrigin(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && !["same-origin","none"].includes(site)) throw new HttpError(403,"Solicitud de otro sitio bloqueada.");
  const origin = request.headers.get("origin");
  const expected = process.env.APP_PUBLIC_URL ? new URL(process.env.APP_PUBLIC_URL).origin : new URL(request.url).origin;
  if (origin && origin !== expected) throw new HttpError(403,"Origen no autorizado.");
}
export async function requireMemberRequest(request: Request, moderator = false) {
  const site = request.headers.get("sec-fetch-site");
  const navigation = request.method === "GET" && request.headers.get("sec-fetch-mode") === "navigate" && !["object","embed"].includes(request.headers.get("sec-fetch-dest") ?? "");
  if (site && !["same-origin","none"].includes(site) && !navigation) throw new HttpError(403,"Acceso a archivos desde otro sitio bloqueado.");
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) throw new HttpError(401,"Inicia sesión para acceder al archivo.");
  await requireMemberId(userId,moderator);
  return userId;
}
export async function requireMemberId(userId: string, moderator = false) {
  const sql = await getSql();
  const [me] = await sql<{status:string;role:string}>`select status,role from members where user_id=${userId} limit 1`;
  if (me?.status !== "activo" || (moderator && me.role !== "moderador")) throw new HttpError(403,moderator ? "Solo un moderador activo puede realizar esta acción." : "Tu registro debe estar activo.");
}
export async function readSmallJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new HttpError(415,"Se requiere JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400,"Solicitud vacía.");
  let total = 0; const chunks: Uint8Array[] = [];
  try {
    for (;;) { const {done,value} = await reader.read(); if (done) break; total += value.byteLength; if (total > 16384) { await reader.cancel(); throw new HttpError(413,"Solicitud demasiado grande."); } chunks.push(value); }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400,"JSON no válido."); }
}
export function apiError(error: unknown): Response {
  // Google response bodies and credentials are never reflected to the browser.
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof HttpError ? error.message : "No se pudo completar la operación. Revisa la configuración en Control.";
  return Response.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
}
