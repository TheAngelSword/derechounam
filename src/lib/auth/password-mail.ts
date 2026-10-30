import type { EnvLike } from "../personal/hosts.ts";
import { ownerEmails } from "../personal/owner.ts";

export const RESET_PUBLIC_MESSAGE = "Si el correo puede recuperar la clave, revisa tu bandeja.";

/** Both values are required. A key without a From address cannot send. */
export function passwordResetConfigured(env: EnvLike): boolean {
  return Boolean((env.RESEND_API_KEY ?? "").trim() && (env.EMAIL_FROM ?? "").trim());
}

/**
 * On the personal host only the owner may receive a reset. The portal accepts
 * any address. The HTTP response stays the same either way.
 */
export function personalResetAllowed(email: string, env: EnvLike, personal: boolean): boolean {
  if (!personal) return true;
  const normalized = email.trim().toLowerCase();
  return Boolean(normalized) && ownerEmails(env.PERSONAL_OWNER_EMAILS).includes(normalized);
}

type SendInput = { to: string; url: string };

/** Sends one reset message. The error text never includes the API key or the link. */
export async function sendResetEmail(env: EnvLike, input: SendInput, fetchImpl: typeof fetch = fetch): Promise<void> {
  const key = (env.RESEND_API_KEY ?? "").trim();
  const from = (env.EMAIL_FROM ?? "").trim();
  if (!key || !from) throw new Error("RESEND_API_KEY o EMAIL_FROM no están definidos.");
  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: "Restablece tu contraseña",
      text: `Para elegir una clave nueva abre este enlace. Caduca en una hora.\n\n${input.url}\n\nSi no pediste este cambio, ignora el mensaje.`,
    }),
  });
  if (!response.ok) throw new Error(`Resend respondió ${response.status}.`);
}
