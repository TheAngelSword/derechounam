import { createHmac, timingSafeEqual } from "node:crypto";
import { secretMatches } from "./secrets.ts";

export function verifyMetaSignature(appSecret: string | undefined, rawBody: string, header: string | null): boolean {
  if (!appSecret || appSecret.length < 8 || !header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const given = header.slice("sha256=".length).trim();
  return secretMatches(given, expected, 8);
}

export function metaChallenge(url: URL, verifyToken: string | undefined): string | null {
  if (url.searchParams.get("hub.mode") !== "subscribe") return null;
  if (!secretMatches(url.searchParams.get("hub.verify_token"), verifyToken, 8)) return null;
  return url.searchParams.get("hub.challenge");
}

export type InboundText = { id: string; from: string; text: string };

export function metaMessages(body: unknown): InboundText[] {
  const messages: InboundText[] = [];
  const entries = (body as { entry?: unknown[] } | null)?.entry;
  if (!Array.isArray(entries)) return messages;
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] }).changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      const value = (change as { value?: { messages?: unknown[] } }).value;
      if (!Array.isArray(value?.messages)) continue;
      for (const message of value.messages) {
        const row = message as { id?: string; from?: string; type?: string; text?: { body?: string } };
        if (row.type !== "text" || !row.id || !row.from || !row.text?.body) continue;
        messages.push({ id: row.id, from: row.from, text: row.text.body });
      }
    }
  }
  return messages;
}

export function twilioSignature(authToken: string, url: string, params: Record<string, string>): string {
  const data = url + Object.keys(params).sort().map((key) => key + params[key]).join("");
  return createHmac("sha1", authToken).update(Buffer.from(data, "utf8")).digest("base64");
}

export function verifyTwilioSignature(authToken: string | undefined, url: string, params: Record<string, string>, header: string | null): boolean {
  if (!authToken || !header) return false;
  const expected = twilioSignature(authToken, url, params);
  const given = Buffer.from(header);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length) return timingSafeEqual(wanted, wanted) && false;
  return timingSafeEqual(given, wanted);
}

export function formParams(raw: string): Record<string, string> {
  const params = new URLSearchParams(raw);
  const out: Record<string, string> = {};
  for (const [key, value] of params.entries()) out[key] = value;
  return out;
}
