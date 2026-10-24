export type SendResult = { ok: true; id?: string } | { ok: false; error: string };
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
export type EnvLike = Record<string, string | undefined>;
export type ProviderId = "meta" | "twilio" | "callmebot";

export function configuredProvider(env: EnvLike): ProviderId | null {
  const value = env.WHATSAPP_PROVIDER?.trim().toLowerCase();
  if (value === "meta" || value === "twilio" || value === "callmebot") return value;
  return null;
}

export function providerReady(env: EnvLike, id: ProviderId = configuredProvider(env) ?? "meta"): boolean {
  if (id === "meta") return Boolean(env.WHATSAPP_CLOUD_TOKEN && env.WHATSAPP_CLOUD_PHONE_ID && env.WHATSAPP_TO);
  if (id === "twilio") return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_FROM && env.WHATSAPP_TO);
  return Boolean(env.CALLMEBOT_PHONE && env.CALLMEBOT_APIKEY);
}

export function whatsappPublicStatus(env: EnvLike): { provider: ProviderId | null; ready: boolean; inbound: boolean } {
  const provider = configuredProvider(env);
  if (!provider) return { provider: null, ready: false, inbound: false };
  const inbound = provider === "meta"
    ? Boolean(env.WHATSAPP_APP_SECRET && env.WHATSAPP_WEBHOOK_VERIFY_TOKEN)
    : provider === "twilio"
      ? Boolean(env.TWILIO_AUTH_TOKEN && env.APP_PUBLIC_URL)
      : false;
  return { provider, ready: providerReady(env, provider), inbound };
}

function clip(error: string): string {
  return error.replace(/Bearer\s+\S+/gi, "Bearer ***").replace(/apikey=[^&\s]+/gi, "apikey=***").replace(/[A-Za-z0-9_-]{24,}/g, "***").slice(0, 180);
}

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

export function samePhone(a: string, b: string): boolean {
  const left = digits(a);
  const right = digits(b);
  if (left.length < 10 || right.length < 10) return false;
  return left.slice(-10) === right.slice(-10);
}

export function whatsappTo(env: EnvLike): string {
  return digits(env.WHATSAPP_TO ?? env.CALLMEBOT_PHONE ?? "");
}

async function readError(response: Response): Promise<string> {
  const text = await response.text();
  return clip(text || `HTTP ${response.status}`);
}

export function createWhatsAppSender(env: EnvLike, fetchImpl: FetchLike = fetch): {
  provider: ProviderId;
  send: (body: string) => Promise<SendResult>;
} | { error: string } {
  const provider = configuredProvider(env);
  if (!provider) return { error: "Define WHATSAPP_PROVIDER en meta, twilio o callmebot." };
  if (!providerReady(env, provider)) return { error: `Faltan variables del proveedor ${provider}.` };
  const to = whatsappTo(env);
  return {
    provider,
    async send(body: string) {
      const text = body.trim().slice(0, 1500);
      if (!text) return { ok: false, error: "Mensaje vacío." };
      try {
        if (provider === "meta") return await sendMeta(env, to, text, fetchImpl);
        if (provider === "twilio") return await sendTwilio(env, to, text, fetchImpl);
        return await sendCallMeBot(env, text, fetchImpl);
      } catch (error) {
        return { ok: false, error: clip(error instanceof Error ? error.message : "No se pudo enviar.") };
      }
    },
  };
}

async function sendMeta(env: EnvLike, to: string, body: string, fetchImpl: FetchLike): Promise<SendResult> {
  const version = env.WHATSAPP_CLOUD_VERSION?.trim() || "v21.0";
  const phoneId = env.WHATSAPP_CLOUD_PHONE_ID?.trim() ?? "";
  const mode = env.WHATSAPP_CLOUD_MODE?.trim().toLowerCase() === "template" ? "template" : "text";
  const payload = mode === "template"
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: env.WHATSAPP_CLOUD_TEMPLATE_NAME?.trim() || "recordatorio",
          language: { code: env.WHATSAPP_CLOUD_TEMPLATE_LANG?.trim() || "es_MX" },
          components: [{ type: "body", parameters: [{ type: "text", text: body.slice(0, 900) }] }],
        },
      }
    : { messaging_product: "whatsapp", to, type: "text", text: { preview_url: false, body } };
  const response = await fetchImpl(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WHATSAPP_CLOUD_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) return { ok: false, error: await readError(response) };
  const json = await response.json().catch(() => ({})) as { messages?: Array<{ id?: string }> };
  return { ok: true, id: json.messages?.[0]?.id };
}

async function sendTwilio(env: EnvLike, to: string, body: string, fetchImpl: FetchLike): Promise<SendResult> {
  const sid = env.TWILIO_ACCOUNT_SID?.trim() ?? "";
  const from = env.TWILIO_WHATSAPP_FROM?.trim() ?? "";
  const auth = Buffer.from(`${sid}:${env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const form = new URLSearchParams({ From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`, To: `whatsapp:+${to}`, Body: body });
  const response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!response.ok) return { ok: false, error: await readError(response) };
  const json = await response.json().catch(() => ({})) as { sid?: string };
  return { ok: true, id: json.sid };
}

async function sendCallMeBot(env: EnvLike, body: string, fetchImpl: FetchLike): Promise<SendResult> {
  const phone = digits(env.CALLMEBOT_PHONE ?? "");
  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", body);
  url.searchParams.set("apikey", env.CALLMEBOT_APIKEY ?? "");
  const response = await fetchImpl(url.href, { method: "GET" });
  const reply = await response.text();
  if (!response.ok || /\berror\b/i.test(reply)) return { ok: false, error: clip(reply || `HTTP ${response.status}`) };
  return { ok: true };
}
