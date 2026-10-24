import { buildIcs } from "./ics";
import { requestIsPersonal } from "./request.server";
import { bearerMatches, secretMatches } from "./secrets";
import { calendarItems, dispatchReminders, ownerUserId, replyForRange, addFromCommand } from "./service.server";
import { helpMessage, parseInbound } from "./commands";
import { formParams, metaChallenge, metaMessages, verifyMetaSignature, verifyTwilioSignature } from "./webhook";
import { createWhatsAppSender, samePhone, whatsappTo } from "./whatsapp";
import { hostFromHeader, originOf, personalHostnames } from "./hosts";
import { getSql } from "@/lib/db";

const hidden = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

function missing(): Response {
  return new Response("No encontrado.", { status: 404, headers: { ...hidden, "Content-Type": "text/plain; charset=utf-8" } });
}

export async function icsResponse(request: Request): Promise<Response> {
  if (!requestIsPersonal()) return missing();
  const token = new URL(request.url).searchParams.get("token");
  if (!secretMatches(token, process.env.PERSONAL_ICS_TOKEN, 24)) return missing();
  const body = buildIcs(await calendarItems());
  return new Response(body, {
    headers: {
      ...hidden,
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=\"pnota.ics\"",
    },
  });
}

export async function cronResponse(request: Request): Promise<Response> {
  if (!bearerMatches(request.headers.get("authorization"), process.env.CRON_SECRET)) return missing();
  const result = await dispatchReminders();
  return Response.json(result, { headers: hidden });
}

function webhookUrl(request: Request): string {
  const url = new URL(request.url);
  const path = `${url.pathname}${url.search}`;
  const host = hostFromHeader(request.headers.get("host"));
  const personal = originOf(process.env.PERSONAL_PUBLIC_URL);
  if (personal && host && personalHostnames(process.env).includes(host)) return `${personal}${path}`;
  const app = originOf(process.env.APP_PUBLIC_URL);
  if (app) return `${app}${path}`;
  return `${url.origin}${path}`;
}

export async function whatsappGet(request: Request): Promise<Response> {
  const challenge = metaChallenge(new URL(request.url), process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN);
  if (challenge === null) return missing();
  return new Response(challenge, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function whatsappPost(request: Request): Promise<Response> {
  const raw = await request.text();
  const contentType = request.headers.get("content-type") ?? "";
  let messages: { id: string; from: string; text: string }[] = [];
  if (contentType.includes("application/json")) {
    if (!verifyMetaSignature(process.env.WHATSAPP_APP_SECRET, raw, request.headers.get("x-hub-signature-256"))) return missing();
    try { messages = metaMessages(JSON.parse(raw)); } catch { return missing(); }
  } else {
    const params = formParams(raw);
    if (!verifyTwilioSignature(process.env.TWILIO_AUTH_TOKEN, webhookUrl(request), params, request.headers.get("x-twilio-signature"))) return missing();
    if (!params.Body || !params.From || !params.MessageSid) return Response.json({ ok: true }, { headers: hidden });
    messages = [{ id: params.MessageSid, from: params.From, text: params.Body }];
  }
  const sender = createWhatsAppSender(process.env);
  for (const message of messages) {
    const reply = await answerInbound(message);
    if (reply && !("error" in sender)) await sender.send(reply);
  }
  if (contentType.includes("application/json")) return Response.json({ ok: true }, { headers: hidden });
  return new Response("<Response></Response>", { headers: { ...hidden, "Content-Type": "text/xml; charset=utf-8" } });
}

async function answerInbound(message: { id: string; from: string; text: string }): Promise<string> {
  if (!samePhone(message.from, whatsappTo(process.env))) return "";
  const sql = await getSql();
  const claimed = await sql`insert into personal_inbound (provider_message_id) values (${message.id.slice(0, 200)}) on conflict do nothing returning provider_message_id`;
  if (!claimed.length) return "";
  const userId = await ownerUserId();
  if (!userId) return "Primero entra una vez al portal con el correo del titular.";
  const command = parseInbound(message.text);
  if (command.type === "help" || command.type === "unknown") return helpMessage();
  if (command.type === "list") return replyForRange(userId, command.range);
  const item = await addFromCommand(userId, command);
  return `Anotado: ${item.title}`;
}
