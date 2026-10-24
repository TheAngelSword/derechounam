import test from "node:test";
import assert from "node:assert/strict";
import { isPersonalSite, isPortalPage, personalHostnames, portalOrigin } from "../../src/lib/personal/hosts.ts";
import { ownerDecision } from "../../src/lib/personal/owner.ts";
import { secretMatches, bearerMatches } from "../../src/lib/personal/secrets.ts";
import { applyReview, intervalLabel } from "../../src/lib/personal/srs.ts";
import { mexicoWallToUtc, combineMexico } from "../../src/lib/personal/dates.ts";
import { parseInbound } from "../../src/lib/personal/commands.ts";
import { pendingReminders } from "../../src/lib/personal/reminders.ts";
import { buildIcs, googleCalendarLink } from "../../src/lib/personal/ics.ts";
import { isHighlighted, scheduleFromInput, type PersonalItem } from "../../src/lib/personal/model.ts";
import { createWhatsAppSender, samePhone } from "../../src/lib/personal/whatsapp.ts";
import { verifyMetaSignature, metaChallenge, metaMessages, verifyTwilioSignature, twilioSignature } from "../../src/lib/personal/webhook.ts";
import { createHmac } from "node:crypto";

const now = new Date("2026-10-24T18:00:00.000Z");

function item(partial: Partial<PersonalItem> & Pick<PersonalItem, "id" | "kind" | "title">): PersonalItem {
  return {
    notes: "", subject: "", location: "", url: "", startsAt: null, endsAt: null, dueAt: null, allDay: false,
    priority: "normal", status: "pendiente", reminderMinutes: [1440, 60], ease: 2.5, intervalDays: 0, repetitions: 0,
    nextReviewAt: null, progressCurrent: 0, progressTotal: 0, progressUnit: "paginas", updatedAt: now.toISOString(),
    ...partial,
  };
}

test("pnota.com es el sitio personal y derechounam.com no", () => {
  const env = { PERSONAL_PUBLIC_URL: "https://pnota.com", APP_PUBLIC_URL: "https://derechounam.com" };
  assert.deepEqual(personalHostnames(env), ["pnota.com", "www.pnota.com"]);
  assert.equal(isPersonalSite("pnota.com", env), true);
  assert.equal(isPersonalSite("www.pnota.com", env), true);
  assert.equal(isPersonalSite("derechounam.com", env), false);
  assert.equal(isPersonalSite("pnota.com.evil.test", env), false);
  assert.equal(isPersonalSite("evil.pnota.com", env), false);
  assert.equal(isPersonalSite("localhost", {}), false);
  assert.equal(isPersonalSite("derechounam.com", { SITE_MODE: "personal" }), true);
  assert.equal(portalOrigin({ PORTAL_PUBLIC_URL: "https://derechounam.com" }), "https://derechounam.com");
  assert.equal(isPortalPage("/tareas"), true);
  assert.equal(isPortalPage("/api/personal/recordatorios"), false);
});

test("solo el correo del titular entra, y dev-user nunca en producción", () => {
  assert.equal(ownerDecision({ userId: "u1", email: "Angel@UNAM.mx", allowRaw: "angel@unam.mx", production: true }), "owner");
  assert.equal(ownerDecision({ userId: "u2", email: "otro@unam.mx", allowRaw: "angel@unam.mx", production: true }), "denied");
  assert.equal(ownerDecision({ userId: "mod", email: "mod@unam.mx", allowRaw: "", production: true }), "denied");
  assert.equal(ownerDecision({ userId: "dev-user", email: null, allowRaw: "dev-user", production: true }), "denied");
  assert.equal(ownerDecision({ userId: "dev-user", email: null, allowRaw: "dev-user", production: false }), "owner");
});

test("el token y el cron comparan en tiempo constante y fallan si faltan", () => {
  assert.equal(secretMatches("x".repeat(24), "x".repeat(24)), true);
  assert.equal(secretMatches("y".repeat(24), "x".repeat(24)), false);
  assert.equal(secretMatches("corto", "corto"), false);
  assert.equal(bearerMatches("Bearer " + "a".repeat(16), "a".repeat(16)), true);
  assert.equal(bearerMatches("Bearer no", "a".repeat(16)), false);
});

test("repaso espaciado: otra vez vuelve a un día y bien se alarga", () => {
  const again = applyReview({ ease: 2.5, intervalDays: 10, repetitions: 3 }, "otra");
  assert.equal(again.repetitions, 0);
  assert.equal(again.intervalDays, 1);
  const good = applyReview({ ease: 2.5, intervalDays: 0, repetitions: 0 }, "bien");
  assert.equal(good.intervalDays, 1);
  const second = applyReview(good, "bien");
  assert.equal(second.intervalDays, 6);
  assert.match(intervalLabel(1), /mañana/);
});

test("la hora de México se guarda en UTC", () => {
  const iso = mexicoWallToUtc(2026, 11, 13, 10, 0);
  assert.equal(iso, "2026-11-13T16:00:00.000Z");
  const tarea = scheduleFromInput({ kind: "tarea", date: "2026-11-13", time: "10:00", allDay: false });
  assert.equal(tarea.dueAt, "2026-11-13T16:00:00.000Z");
  const examen = scheduleFromInput({ kind: "examen", date: "2026-11-13", time: null, allDay: true });
  assert.equal(examen.startsAt, combineMexico("2026-11-13", null, true).start);
  assert.equal(isHighlighted(item({ id: "1", kind: "tarea", title: "Ensayo", dueAt: tarea.dueAt })), true);
  assert.equal(isHighlighted(item({ id: "2", kind: "lectura", title: "Libro" })), false);
});

test("WhatsApp entiende hoy, semana y una tarea con fecha", () => {
  assert.deepEqual(parseInbound("¿Qué hay esta semana?", now), { type: "list", range: "semana" });
  assert.equal(parseInbound("hoy", now).type, "list");
  const added = parseInbound("tarea Leer amparo mañana", now);
  assert.equal(added.type, "add");
  if (added.type === "add") {
    assert.equal(added.kind, "tarea");
    assert.match(added.title, /Leer amparo/);
    assert.equal(added.date, "2026-10-25");
  }
});

test("un recordatorio no se repite ni se manda después del evento", () => {
  const anchor = new Date(now.getTime() + 30 * 60_000).toISOString();
  const row = { ...item({ id: "abc", kind: "examen", title: "Civil", startsAt: anchor, reminderMinutes: [60, 15] }), ownerUserId: "owner" };
  const due = pendingReminders([row], new Set(), now);
  assert.equal(due.length, 1);
  assert.equal(due[0]?.offsetMinutes, 60);
  const again = pendingReminders([row], new Set([due[0]!.dedupKey]), now);
  assert.equal(again.length, 0);
  const past = pendingReminders([{ ...row, startsAt: new Date(now.getTime() - 60_000).toISOString() }], new Set(), now);
  assert.equal(past.length, 0);
  const tomorrow = new Date(now.getTime() + 3 * 60 * 60_000).toISOString();
  const dayBefore = pendingReminders([{ ...item({ id: "dia", kind: "examen", title: "Oral", startsAt: tomorrow, reminderMinutes: [1440] }), ownerUserId: "owner" }], new Set(), now);
  assert.equal(dayBefore.length, 1);
  const soon = new Date(now.getTime() + 10 * 60_000).toISOString();
  const quarter = pendingReminders([{ ...item({ id: "q", kind: "clase", title: "Zoom", startsAt: soon, reminderMinutes: [15] }), ownerUserId: "owner" }], new Set(), now);
  assert.equal(quarter.length, 1);
  const weekLate = pendingReminders([{ ...item({ id: "w", kind: "examen", title: "Final", startsAt: tomorrow, reminderMinutes: [10080] }), ownerUserId: "owner" }], new Set(), now);
  assert.equal(weekLate.length, 0);
});

test("el calendario privado no incluye archivados y genera liga de Google", () => {
  const visible = item({ id: "11111111-1111-4111-8111-111111111111", kind: "examen", title: "Amparo", startsAt: "2026-11-13T16:00:00.000Z", endsAt: "2026-11-13T18:00:00.000Z" });
  const hidden = item({ id: "22222222-2222-4222-8222-222222222222", kind: "tarea", title: "Vieja", dueAt: "2026-11-01T16:00:00.000Z", status: "archivado" });
  const ics = buildIcs([visible, hidden], now);
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /Amparo/);
  assert.doesNotMatch(ics, /Vieja/);
  assert.match(googleCalendarLink(visible) ?? "", /^https:\/\/calendar\.google\.com\/calendar\/render\?/);
});

test("WhatsApp no envía si el proveedor no está elegido y no confunde teléfonos", () => {
  assert.equal("error" in createWhatsAppSender({}), true);
  assert.equal(samePhone("whatsapp:+5215555555555", "525555555555"), true);
  assert.equal(samePhone("5215555555555", "5215555550000"), false);
  const calls: string[] = [];
  const sender = createWhatsAppSender({
    WHATSAPP_PROVIDER: "callmebot",
    CALLMEBOT_PHONE: "5215555555555",
    CALLMEBOT_APIKEY: "secreto-de-prueba",
  }, async (url) => {
    calls.push(url);
    return new Response("Message queued.");
  });
  assert.equal("error" in sender, false);
  if (!("error" in sender)) {
    return sender.send("Hola").then((result) => {
      assert.equal(result.ok, true);
      assert.match(calls[0] ?? "", /callmebot\.com/);
      assert.doesNotMatch(JSON.stringify(result), /secreto-de-prueba/);
    });
  }
});

test("la firma de Meta y la de Twilio rechazan un cuerpo alterado", () => {
  const secret = "app-secret";
  const body = "{\"ok\":true}";
  const signature = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifyMetaSignature(secret, body, signature), true);
  assert.equal(verifyMetaSignature(secret, body + " ", signature), false);
  const url = new URL("https://pnota.com/api/personal/whatsapp?hub.mode=subscribe&hub.verify_token=token-largo&hub.challenge=abc");
  assert.equal(metaChallenge(url, "token-largo"), "abc");
  assert.equal(metaChallenge(url, "otro-token"), null);
  const messages = metaMessages({ entry: [{ changes: [{ value: { messages: [{ id: "m1", from: "5215555555555", type: "text", text: { body: "semana" } }] } }] }] });
  assert.equal(messages[0]?.text, "semana");
  const params = { Body: "hoy", From: "whatsapp:+5215555555555", MessageSid: "SM1" };
  const hook = "https://pnota.com/api/personal/whatsapp";
  const signed = twilioSignature("twilio-secret", hook, params);
  assert.equal(verifyTwilioSignature("twilio-secret", hook, params, signed), true);
  assert.equal(verifyTwilioSignature("twilio-secret", hook, { ...params, Body: "otro" }, signed), false);
});
