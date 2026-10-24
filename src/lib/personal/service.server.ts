import { randomUUID } from "node:crypto";
import { getSql, type Sql } from "@/lib/db";
import { isProductionEnv, originOf } from "./hosts";
import { ownerEmails } from "./owner";
import { applyReview } from "./srs";
import { addCalendarDays, mexicoDayStartUtc, mexicoParts, publicHttpsUrl } from "./dates";
import { cleanReminders, scheduleFromInput, type PersonalItem, type PersonalKind, type PersonalPriority, type PersonalStatus, type ProgressUnit, type SavePersonalInput } from "./model";
import { pendingReminders } from "./reminders";
import { createWhatsAppSender, whatsappPublicStatus, type FetchLike } from "./whatsapp";
import { agendaText } from "./agenda";

type Row = {
  id: string;
  owner_user_id: string;
  kind: PersonalKind;
  title: string;
  notes: string;
  subject: string;
  location: string;
  url: string;
  starts_at: unknown;
  ends_at: unknown;
  due_at: unknown;
  all_day: boolean;
  priority: PersonalPriority;
  status: PersonalStatus;
  reminder_minutes: string;
  ease: number;
  interval_days: number;
  repetitions: number;
  next_review_at: unknown;
  progress_current: number;
  progress_total: number;
  progress_unit: ProgressUnit;
  updated_at: unknown;
};

const iso = (value: unknown): string | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

function mapItem(row: Row): PersonalItem {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    notes: row.notes,
    subject: row.subject,
    location: row.location,
    url: row.url,
    startsAt: iso(row.starts_at),
    endsAt: iso(row.ends_at),
    dueAt: iso(row.due_at),
    allDay: Boolean(row.all_day),
    priority: row.priority,
    status: row.status,
    reminderMinutes: cleanReminders(String(row.reminder_minutes ?? "").split(",").map(Number)),
    ease: Number(row.ease) || 2.5,
    intervalDays: Number(row.interval_days) || 0,
    repetitions: Number(row.repetitions) || 0,
    nextReviewAt: iso(row.next_review_at),
    progressCurrent: Number(row.progress_current) || 0,
    progressTotal: Number(row.progress_total) || 0,
    progressUnit: row.progress_unit,
    updatedAt: iso(row.updated_at) ?? new Date().toISOString(),
  };
}

async function ownerIds(sql: Sql): Promise<Set<string>> {
  const emails = ownerEmails(process.env.PERSONAL_OWNER_EMAILS).filter((email) => email.includes("@"));
  const ids = new Set<string>();
  if (!isProductionEnv(process.env) && ownerEmails(process.env.PERSONAL_OWNER_EMAILS).includes("dev-user")) ids.add("dev-user");
  if (emails.length) {
    const rows = await sql.query<{ id: string }>(`select id from "user" where lower(email) = any($1::text[])`, [emails]);
    for (const row of rows) ids.add(row.id);
  }
  return ids;
}

export async function listItems(userId: string): Promise<PersonalItem[]> {
  const sql = await getSql();
  const rows = await sql<Row>`select * from personal_items where owner_user_id=${userId} and status<>'archivado' order by coalesce(due_at, starts_at, next_review_at, updated_at)`;
  return rows.map(mapItem);
}

export async function saveItem(userId: string, input: SavePersonalInput): Promise<PersonalItem> {
  const sql = await getSql();
  const url = publicHttpsUrl(input.url);
  const schedule = scheduleFromInput(input);
  const reminders = cleanReminders(input.reminderMinutes).join(",") || "1440,60";
  const progressTotal = input.progressUnit === "porcentaje" ? 100 : input.progressTotal;
  if (input.id) {
    const rows = await sql<Row>`update personal_items set kind=${input.kind}, title=${input.title}, notes=${input.notes}, subject=${input.subject}, location=${input.location}, url=${url}, starts_at=${schedule.startsAt}, ends_at=${schedule.endsAt}, due_at=${schedule.dueAt}, all_day=${schedule.allDay}, priority=${input.priority}, reminder_minutes=${reminders}, next_review_at=case when ${input.kind}='repaso' then coalesce(${schedule.nextReviewAt}, next_review_at) else null end, progress_current=${input.progressCurrent}, progress_total=${progressTotal}, progress_unit=${input.progressUnit}, updated_at=now() where id=${input.id} and owner_user_id=${userId} returning *`;
    if (!rows[0]) throw new Error("No encontrado.");
    return mapItem(rows[0]);
  }
  const id = randomUUID();
  const nextReview = input.kind === "repaso" ? (schedule.nextReviewAt ?? new Date().toISOString()) : null;
  const rows = await sql<Row>`insert into personal_items (id, owner_user_id, kind, title, notes, subject, location, url, starts_at, ends_at, due_at, all_day, priority, reminder_minutes, next_review_at, progress_current, progress_total, progress_unit) values (${id}, ${userId}, ${input.kind}, ${input.title}, ${input.notes}, ${input.subject}, ${input.location}, ${url}, ${schedule.startsAt}, ${schedule.endsAt}, ${schedule.dueAt}, ${schedule.allDay}, ${input.priority}, ${reminders}, ${nextReview}, ${input.progressCurrent}, ${progressTotal}, ${input.progressUnit}) returning *`;
  return mapItem(rows[0]);
}

export async function setStatus(userId: string, id: string, status: PersonalStatus): Promise<void> {
  const sql = await getSql();
  const rows = await sql`update personal_items set status=${status}, updated_at=now() where id=${id} and owner_user_id=${userId} returning id`;
  if (!rows.length) throw new Error("No encontrado.");
}

export async function removeItem(userId: string, id: string): Promise<void> {
  const sql = await getSql();
  const rows = await sql`delete from personal_items where id=${id} and owner_user_id=${userId} returning id`;
  if (!rows.length) throw new Error("No encontrado.");
}

export async function reviewItem(userId: string, id: string, grade: "otra" | "dificil" | "bien" | "facil"): Promise<PersonalItem> {
  const sql = await getSql();
  const [current] = await sql<Row>`select * from personal_items where id=${id} and owner_user_id=${userId} and kind='repaso' limit 1`;
  if (!current) throw new Error("No encontrado.");
  const next = applyReview({ ease: Number(current.ease) || 2.5, intervalDays: Number(current.interval_days) || 0, repetitions: Number(current.repetitions) || 0 }, grade);
  const today = mexicoParts();
  const when = addCalendarDays(today, next.intervalDays);
  const reviewAt = mexicoDayStartUtc(when.year, when.month, when.day);
  const rows = await sql<Row>`update personal_items set ease=${next.ease}, interval_days=${next.intervalDays}, repetitions=${next.repetitions}, next_review_at=${reviewAt}, updated_at=now() where id=${id} and owner_user_id=${userId} returning *`;
  return mapItem(rows[0]);
}

export async function setProgress(userId: string, id: string, current: number): Promise<PersonalItem> {
  const sql = await getSql();
  const rows = await sql<Row>`update personal_items set progress_current=least(${current}, case when progress_unit='porcentaje' then 100 else greatest(progress_total, ${current}) end), progress_total=case when progress_unit='porcentaje' then 100 when progress_total<${current} then ${current} else progress_total end, updated_at=now() where id=${id} and owner_user_id=${userId} and kind='lectura' returning *`;
  if (!rows[0]) throw new Error("No encontrado.");
  return mapItem(rows[0]);
}

export function subscriptionUrl(): string | null {
  const token = process.env.PERSONAL_ICS_TOKEN?.trim();
  const origin = originOf(process.env.PERSONAL_PUBLIC_URL) ?? originOf(process.env.APP_PUBLIC_URL);
  if (!token || token.length < 24 || !origin) return null;
  return `${origin}/api/personal/calendario.ics?token=${encodeURIComponent(token)}`;
}

export async function calendarItems(): Promise<PersonalItem[]> {
  const sql = await getSql();
  const ids = await ownerIds(sql);
  if (!ids.size) return [];
  const rows = await sql.query<Row>(`select * from personal_items where status<>'archivado' and owner_user_id = any($1::text[])`, [[...ids]]);
  return rows.map(mapItem);
}

export async function dispatchReminders(fetchImpl?: FetchLike): Promise<{ sent: number; failed: number; note: string | null }> {
  const sender = createWhatsAppSender(process.env, fetchImpl);
  if ("error" in sender) return { sent: 0, failed: 0, note: sender.error };
  const sql = await getSql();
  const ids = await ownerIds(sql);
  if (!ids.size) return { sent: 0, failed: 0, note: "Ninguna cuenta del titular está dada de alta todavía." };
  const rows = await sql.query<Row>(`select * from personal_items where status='pendiente' and owner_user_id = any($1::text[])`, [[...ids]]);
  const items = rows.map((row) => ({ ...mapItem(row), ownerUserId: row.owner_user_id }));
  const candidates = pendingReminders(items, new Set(), new Date());
  if (!candidates.length) return { sent: 0, failed: 0, note: null };
  const known = await sql.query<{ dedup_key: string }>(`select dedup_key from personal_reminder_log where status in ('enviando','enviado') and dedup_key = any($1::text[])`, [candidates.map((item) => item.dedupKey)]);
  const sentKeys = new Set(known.map((row) => row.dedup_key));
  let sent = 0;
  let failed = 0;
  for (const reminder of candidates) {
    if (sentKeys.has(reminder.dedupKey)) continue;
    const claimed = await sql<{ dedup_key: string }>`insert into personal_reminder_log (owner_user_id, item_id, dedup_key, channel, status) values (${reminder.ownerUserId}, ${reminder.itemId}, ${reminder.dedupKey}, ${sender.provider}, 'enviando') on conflict (dedup_key) do update set status='enviando', error=null, sent_at=now() where personal_reminder_log.status='error' and personal_reminder_log.sent_at < now() - interval '10 minutes' returning dedup_key`;
    if (!claimed.length) continue;
    const result = await sender.send(reminder.body);
    if (result.ok) {
      sent += 1;
      await sql`update personal_reminder_log set status='enviado', error=null, sent_at=now() where dedup_key=${reminder.dedupKey}`;
    } else {
      failed += 1;
      await sql`update personal_reminder_log set status='error', error=${result.error}, sent_at=now() where dedup_key=${reminder.dedupKey}`;
    }
  }
  return { sent, failed, note: null };
}

export async function sendTestMessage(fetchImpl?: FetchLike): Promise<{ ok: true } | { ok: false; error: string }> {
  const sender = createWhatsAppSender(process.env, fetchImpl);
  if ("error" in sender) return { ok: false, error: sender.error };
  const sql = await getSql();
  const minute = new Date().toISOString().slice(0, 16);
  const key = `test:${minute}`;
  const claimed = await sql`insert into personal_reminder_log (owner_user_id, item_id, dedup_key, channel, status) values ('titular', null, ${key}, ${sender.provider}, 'enviando') on conflict (dedup_key) do nothing returning dedup_key`;
  if (!claimed.length) return { ok: false, error: "Espera un minuto antes de enviar otra prueba." };
  const result = await sender.send("Mensaje de prueba de pnota. Si lo ves, WhatsApp está conectado.");
  await sql`update personal_reminder_log set status=${result.ok ? "enviado" : "error"}, error=${result.ok ? null : result.error}, sent_at=now() where dedup_key=${key}`;
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export function integrationStatus() {
  return { whatsapp: whatsappPublicStatus(process.env), calendarUrl: subscriptionUrl() };
}

export async function addFromCommand(userId: string, input: { kind: PersonalKind; title: string; date: string | null; time: string | null; allDay: boolean }): Promise<PersonalItem> {
  return saveItem(userId, {
    kind: input.kind,
    title: input.title,
    notes: "Creado por WhatsApp.",
    subject: "",
    location: "",
    url: "",
    date: input.date,
    time: input.time,
    allDay: input.allDay,
    priority: input.kind === "examen" || input.kind === "tarea" ? "importante" : "normal",
    reminderMinutes: [1440, 60],
    progressCurrent: 0,
    progressTotal: 0,
    progressUnit: "paginas",
  });
}

export async function replyForRange(userId: string, range: "hoy" | "semana"): Promise<string> {
  return agendaText(await listItems(userId), range);
}

export async function ownerUserId(): Promise<string | null> {
  const sql = await getSql();
  const preferred = process.env.WHATSAPP_OWNER_EMAIL?.trim().toLowerCase();
  const emails = ownerEmails(process.env.PERSONAL_OWNER_EMAILS).filter((email) => email.includes("@"));
  const ordered = preferred ? [preferred, ...emails.filter((email) => email !== preferred)] : emails;
  for (const email of ordered) {
    const [row] = await sql<{ id: string }>`select id from "user" where lower(email)=${email} limit 1`;
    if (row) return row.id;
  }
  if (!isProductionEnv(process.env) && ownerEmails(process.env.PERSONAL_OWNER_EMAILS).includes("dev-user")) return "dev-user";
  return null;
}
