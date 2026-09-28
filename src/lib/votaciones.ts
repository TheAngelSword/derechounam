import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export type VoteResponse = {
  id: number;
  pollId: number;
  participantName: string;
  availableDate: string;
  availableTime: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ActivityPoll = {
  id: number;
  eventId: number | null;
  title: string;
  prompt: string;
  description: string;
  isOpen: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  eventTitle: string | null;
  eventDate: string | null;
  eventTime: string | null;
  eventPlace: string | null;
  responses: VoteResponse[];
};

type MemberRow = {
  alias: string;
  role: string;
  status: string;
};

const titleSchema = z.string().trim().min(2).max(180);
const promptSchema = z.string().trim().min(2).max(300);
const descriptionSchema = z.string().trim().max(1200).optional();

function asIsoDate(value: unknown) {
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

function asTime(value: unknown) {
  return String(value ?? "").slice(0, 5);
}

function participantKey(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("es-MX").replace(/\s+/g, " ").trim();
}

async function activeMember(userId: string) {
  const sql = await getSql();
  const rows = await sql<MemberRow>`select alias, role, status from members where user_id = ${userId} limit 1`;
  const me = rows[0];
  if (!me || me.status !== "activo") throw new Error("Necesitas una cuenta activa del grupo para administrar votaciones.");
  return me;
}

async function requireModerator(userId: string) {
  const me = await activeMember(userId);
  if (me.role !== "moderador") throw new Error("Sólo un administrador puede realizar este cambio.");
  return me;
}

async function canCreateForEvent(userId: string, eventId: number) {
  const me = await activeMember(userId);
  const sql = await getSql();
  const events = await sql<{ created_by: string }>`select created_by from events where id = ${eventId} limit 1`;
  if (!events[0]) throw new Error("La actividad ya no existe.");
  if (events[0].created_by === userId || me.role === "moderador") return;
  const mods = await sql<{ user_id: string }>`select user_id from area_mods where user_id = ${userId} and area = 'agenda' limit 1`;
  if (!mods.length) throw new Error("No tienes permiso para abrir una votación en esta actividad.");
}

async function canManagePoll(userId: string, pollId: number) {
  const me = await activeMember(userId);
  const sql = await getSql();
  const rows = await sql<{ created_by: string }>`select created_by from activity_polls where id = ${pollId} limit 1`;
  if (!rows[0]) throw new Error("Votación no encontrada.");
  if (rows[0].created_by === userId || me.role === "moderador") return me;
  throw new Error("Sólo el autor o un administrador puede editar esta votación.");
}

export const loadPolls = createServerFn({ method: "GET" }).handler(async (): Promise<ActivityPoll[]> => {
  const sql = await getSql();
  const [pollRows, responseRows] = await Promise.all([
    sql<{
      id: number;
      event_id: number | null;
      title: string;
      prompt: string;
      description: string;
      is_open: boolean;
      created_by: string;
      created_at: string;
      updated_at: string;
      event_title: string | null;
      event_date: string | null;
      event_time: string | null;
      event_place: string | null;
    }>`
      select p.id, p.event_id, p.title, p.prompt, p.description, p.is_open, p.created_by,
             p.created_at, p.updated_at,
             e.title as event_title, e.event_date, e.time_slot as event_time, e.place as event_place
      from activity_polls p
      left join events e on e.id = p.event_id
      order by p.is_open desc, p.created_at desc, p.id desc
    `,
    sql<{
      id: number;
      poll_id: number;
      participant_name: string;
      available_date: string;
      available_time: string;
      note: string | null;
      created_at: string;
      updated_at: string;
    }>`
      select id, poll_id, participant_name, available_date, available_time, note, created_at, updated_at
      from activity_poll_responses
      order by available_date, available_time, participant_name
    `,
  ]);

  const responsesByPoll = new Map<number, VoteResponse[]>();
  for (const row of responseRows) {
    const item: VoteResponse = {
      id: row.id,
      pollId: row.poll_id,
      participantName: row.participant_name,
      availableDate: asIsoDate(row.available_date),
      availableTime: asTime(row.available_time),
      note: row.note,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
    const list = responsesByPoll.get(row.poll_id) ?? [];
    list.push(item);
    responsesByPoll.set(row.poll_id, list);
  }

  return pollRows.map((row) => ({
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    prompt: row.prompt,
    description: row.description,
    isOpen: row.is_open,
    createdBy: row.created_by,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    eventTitle: row.event_title,
    eventDate: row.event_date ? asIsoDate(row.event_date) : null,
    eventTime: row.event_time,
    eventPlace: row.event_place,
    responses: responsesByPoll.get(row.id) ?? [],
  }));
});

export const createPoll = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      eventId: z.number().int().positive().optional(),
      title: titleSchema,
      prompt: promptSchema,
      description: descriptionSchema,
    }),
  )
  .handler(async ({ context, data }) => {
    if (data.eventId) await canCreateForEvent(context.userId, data.eventId);
    else await requireModerator(context.userId);

    const sql = await getSql();
    if (data.eventId) {
      const existing = await sql<{ id: number }>`select id from activity_polls where event_id = ${data.eventId} limit 1`;
      if (existing[0]) return { ok: true as const, id: existing[0].id };
    }

    const rows = await sql<{ id: number }>`
      insert into activity_polls (event_id, title, prompt, description, created_by)
      values (${data.eventId ?? null}, ${data.title}, ${data.prompt}, ${data.description ?? ""}, ${context.userId})
      returning id
    `;
    return { ok: true as const, id: rows[0].id };
  });

export const updatePoll = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      title: titleSchema,
      prompt: promptSchema,
      description: descriptionSchema,
      isOpen: z.boolean(),
    }),
  )
  .handler(async ({ context, data }) => {
    await canManagePoll(context.userId, data.id);
    const sql = await getSql();
    await sql`
      update activity_polls
      set title = ${data.title}, prompt = ${data.prompt}, description = ${data.description ?? ""},
          is_open = ${data.isOpen}, updated_at = now()
      where id = ${data.id}
    `;
    return { ok: true as const };
  });

export const removePoll = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ context, data }) => {
    await requireModerator(context.userId);
    const sql = await getSql();
    await sql`delete from activity_polls where id = ${data.id}`;
    return { ok: true as const };
  });

export const savePublicVote = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pollId: z.number().int().positive(),
      participantName: z.string().trim().min(2).max(80),
      availableDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      availableTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      note: z.string().trim().max(240).optional(),
      website: z.string().max(0).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const polls = await sql<{ is_open: boolean }>`select is_open from activity_polls where id = ${data.pollId} limit 1`;
    if (!polls[0]) throw new Error("La votación ya no existe.");
    if (!polls[0].is_open) throw new Error("Esta votación ya está cerrada.");

    const key = participantKey(data.participantName);
    const existing = await sql<{ id: number }>`
      select id from activity_poll_responses where poll_id = ${data.pollId} and participant_key = ${key} limit 1
    `;
    if (!existing[0]) {
      const countRows = await sql<{ n: number }>`select count(*)::int as n from activity_poll_responses where poll_id = ${data.pollId}`;
      if ((countRows[0]?.n ?? 0) >= 250) throw new Error("Esta votación alcanzó el límite de participantes.");
    }

    await sql`
      insert into activity_poll_responses (
        poll_id, participant_name, participant_key, available_date, available_time, note
      ) values (
        ${data.pollId}, ${data.participantName.trim()}, ${key}, ${data.availableDate}, ${data.availableTime}, ${data.note ?? null}
      )
      on conflict (poll_id, participant_key)
      do update set
        participant_name = excluded.participant_name,
        available_date = excluded.available_date,
        available_time = excluded.available_time,
        note = excluded.note,
        updated_at = now()
    `;
    return { ok: true as const };
  });

export const updateVoteResponse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      participantName: z.string().trim().min(2).max(80),
      availableDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      availableTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      note: z.string().trim().max(240).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireModerator(context.userId);
    const sql = await getSql();
    await sql`
      update activity_poll_responses
      set participant_name = ${data.participantName.trim()}, participant_key = ${participantKey(data.participantName)},
          available_date = ${data.availableDate}, available_time = ${data.availableTime}, note = ${data.note ?? null}, updated_at = now()
      where id = ${data.id}
    `;
    return { ok: true as const };
  });

export const removeVoteResponse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ context, data }) => {
    await requireModerator(context.userId);
    const sql = await getSql();
    await sql`delete from activity_poll_responses where id = ${data.id}`;
    return { ok: true as const };
  });
