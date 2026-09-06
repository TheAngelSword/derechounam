import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { Board, BookItem, Course, EventItem, Notice, Professor, RideItem, StudyGroup } from "@/lib/types";

type MemberRow = { alias: string; role: string; status: string };

async function activeMember(userId: string) {
  const sql = await getSql();
  const rows = await sql<MemberRow>`select alias, role, status from members where user_id = ${userId} limit 1`;
  const me = rows[0];
  if (!me || me.status !== "activo") throw new Error("Sin acceso al padrón");
  return me;
}

async function canControl(userId: string, area: string, createdBy: string) {
  const me = await activeMember(userId);
  if (createdBy === userId) return me;
  if (me.role === "moderador") return me;
  const sql = await getSql();
  const mods = await sql<{ user_id: string }>`select user_id from area_mods where user_id = ${userId} and area = ${area}`;
  if (!mods.length) throw new Error("Esta área no te corresponde");
  return me;
}

function asIsoDate(value: unknown) {
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

export const loadBoard = createServerFn({ method: "GET" }).handler(async (): Promise<Board> => {
  const sql = await getSql();
  const [professors, courses, events, books, rides, groups, notices] = await Promise.all([
    sql<{
      id: number;
      full_title: string;
      area: string;
      office: string;
      hours: string;
      modality: string;
    }>`select id, full_title, area, office, hours, modality from professors order by id`,
    sql<{
      id: number;
      code: string;
      name: string;
      chair: string;
      modality: string;
      weekday: string;
      time_slot: string;
      place: string;
      semester: string;
      group_code: string;
    }>`select id, code, name, chair, modality, weekday, time_slot, place, semester, group_code from courses order by time_slot, id`,
    sql<{
      id: number;
      title: string;
      kind: string;
      event_date: string;
      time_slot: string;
      place: string;
      modality: string;
      description: string;
      host_alias: string;
    }>`select id, title, kind, event_date, time_slot, place, modality, description, host_alias from events order by event_date, time_slot`,
    sql<{
      id: number;
      title: string;
      author: string;
      kind: string;
      course: string | null;
      notes: string;
      owner_alias: string;
    }>`select id, title, author, kind, course, notes, owner_alias from books order by id`,
    sql<{
      id: number;
      direction: string;
      from_place: string;
      to_place: string;
      weekday: string;
      time_slot: string;
      seats: number;
      notes: string;
      owner_alias: string;
    }>`select id, direction, from_place, to_place, weekday, time_slot, seats, notes, owner_alias from rides order by weekday, time_slot`,
    sql<{
      id: number;
      name: string;
      course: string;
      when_text: string;
      place: string;
      notes: string;
    }>`select id, name, course, when_text, place, notes from study_groups order by id`,
    sql<{
      id: number;
      title: string;
      body: string;
      pinned: boolean;
      created_at: string;
    }>`select id, title, body, pinned, created_at from notices order by pinned desc, created_at desc`,
  ]);

  return {
    professors: professors.map((row) => ({
      id: row.id,
      fullTitle: row.full_title,
      area: row.area,
      office: row.office,
      hours: row.hours,
      modality: row.modality,
    })) satisfies Professor[],
    courses: courses.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      chair: row.chair,
      modality: row.modality,
      weekday: row.weekday,
      timeSlot: row.time_slot,
      place: row.place,
      semester: row.semester,
      group: row.group_code,
    })) satisfies Course[],
    events: events.map((row) => ({
      id: row.id,
      title: row.title,
      kind: row.kind,
      eventDate: asIsoDate(row.event_date),
      timeSlot: row.time_slot,
      place: row.place,
      modality: row.modality,
      description: row.description,
      hostAlias: row.host_alias,
    })) satisfies EventItem[],
    books: books.map((row) => ({
      id: row.id,
      title: row.title,
      author: row.author,
      kind: row.kind,
      course: row.course,
      notes: row.notes,
      ownerAlias: row.owner_alias,
    })) satisfies BookItem[],
    rides: rides.map((row) => ({
      id: row.id,
      direction: row.direction,
      fromPlace: row.from_place,
      toPlace: row.to_place,
      weekday: row.weekday,
      timeSlot: row.time_slot,
      seats: Number(row.seats),
      notes: row.notes,
      ownerAlias: row.owner_alias,
    })) satisfies RideItem[],
    groups: groups.map((row) => ({
      id: row.id,
      name: row.name,
      course: row.course,
      whenText: row.when_text,
      place: row.place,
      notes: row.notes,
    })) satisfies StudyGroup[],
    notices: notices.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      pinned: Boolean(row.pinned),
      createdAt: String(row.created_at),
    })) satisfies Notice[],
  };
});

const short = z.string().trim().min(2).max(80);
const mid = z.string().trim().min(3).max(280);

export const addCourse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      code: z.string().trim().min(2).max(12),
      name: short,
      chair: short,
      modality: z.enum(["Presencial", "En línea", "Híbrido"]),
      weekday: short,
      timeSlot: z.string().trim().min(4).max(24),
      place: short,
      semester: short,
      group: z.string().trim().min(2).max(12),
    }),
  )
  .handler(async ({ context, data }) => {
    const me = await activeMember(context.userId);
    if (me.role === "alumno") throw new Error("Solo cátedra o moderación sube clases");
    const sql = await getSql();
    await sql`insert into courses (code, name, chair, modality, weekday, time_slot, place, semester, group_code, created_by)
      values (${data.code}, ${data.name}, ${data.chair}, ${data.modality}, ${data.weekday}, ${data.timeSlot}, ${data.place}, ${data.semester}, ${data.group}, ${context.userId})`;
    return { ok: true as const };
  });

export const addProfessor = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      fullTitle: short,
      area: short,
      office: short,
      hours: short,
      modality: z.enum(["Presencial", "En línea", "Híbrido"]),
    }),
  )
  .handler(async ({ context, data }) => {
    const me = await activeMember(context.userId);
    if (me.role === "alumno") throw new Error("Solo cátedra o moderación sube fichas");
    const sql = await getSql();
    await sql`insert into professors (full_title, area, office, hours, modality, created_by)
      values (${data.fullTitle}, ${data.area}, ${data.office}, ${data.hours}, ${data.modality}, ${context.userId})`;
    return { ok: true as const };
  });

export const addEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      title: short,
      kind: z.enum(["Taller", "Conferencia", "Actividad", "Clínica", "Social"]),
      eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      timeSlot: z.string().trim().min(4).max(24),
      place: short,
      modality: z.enum(["Presencial", "En línea", "Híbrido"]),
      description: mid,
      hostAlias: short,
    }),
  )
  .handler(async ({ context, data }) => {
    await activeMember(context.userId);
    const sql = await getSql();
    await sql`insert into events (title, kind, event_date, time_slot, place, modality, description, host_alias, created_by)
      values (${data.title}, ${data.kind}, ${data.eventDate}, ${data.timeSlot}, ${data.place}, ${data.modality}, ${data.description}, ${data.hostAlias}, ${context.userId})`;
    return { ok: true as const };
  });

export const addBook = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      title: short,
      author: short,
      kind: z.enum(["Préstamo", "Venta", "Recomendación"]),
      course: z.string().trim().max(80).optional(),
      notes: mid,
      ownerAlias: short,
    }),
  )
  .handler(async ({ context, data }) => {
    await activeMember(context.userId);
    const sql = await getSql();
    await sql`insert into books (title, author, kind, course, notes, owner_alias, created_by)
      values (${data.title}, ${data.author}, ${data.kind}, ${data.course || null}, ${data.notes}, ${data.ownerAlias}, ${context.userId})`;
    return { ok: true as const };
  });

export const addRide = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      direction: z.enum(["Ida", "Vuelta"]),
      fromPlace: short,
      toPlace: short,
      weekday: z.enum(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]),
      timeSlot: z.string().trim().min(4).max(16),
      seats: z.number().int().min(1).max(6),
      notes: mid,
      ownerAlias: short,
    }),
  )
  .handler(async ({ context, data }) => {
    await activeMember(context.userId);
    const sql = await getSql();
    await sql`insert into rides (direction, from_place, to_place, weekday, time_slot, seats, notes, owner_alias, created_by)
      values (${data.direction}, ${data.fromPlace}, ${data.toPlace}, ${data.weekday}, ${data.timeSlot}, ${data.seats}, ${data.notes}, ${data.ownerAlias}, ${context.userId})`;
    return { ok: true as const };
  });

export const addGroup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      name: short,
      course: short,
      whenText: short,
      place: short,
      notes: mid,
    }),
  )
  .handler(async ({ context, data }) => {
    await activeMember(context.userId);
    const sql = await getSql();
    await sql`insert into study_groups (name, course, when_text, place, notes, created_by)
      values (${data.name}, ${data.course}, ${data.whenText}, ${data.place}, ${data.notes}, ${context.userId})`;
    return { ok: true as const };
  });

export const addNotice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ title: short, body: mid }))
  .handler(async ({ context, data }) => {
    await activeMember(context.userId);
    const sql = await getSql();
    await sql`insert into notices (title, body, pinned, created_by)
      values (${data.title}, ${data.body}, false, ${context.userId})`;
    return { ok: true as const };
  });

const idSchema = z.object({ id: z.number().int().positive() });

export const removeCourse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from courses where id = ${data.id}`;
    if (!rows[0]) return { ok: true as const };
    await canControl(context.userId, "clases", rows[0].created_by);
    await sql`delete from courses where id = ${data.id}`;
    return { ok: true as const };
  });

export const removeProfessor = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from professors where id = ${data.id}`;
    if (!rows[0]) return { ok: true as const };
    await canControl(context.userId, "catedras", rows[0].created_by);
    await sql`delete from professors where id = ${data.id}`;
    return { ok: true as const };
  });

export const removeEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from events where id = ${data.id}`;
    if (!rows[0]) return { ok: true as const };
    await canControl(context.userId, "agenda", rows[0].created_by);
    await sql`delete from events where id = ${data.id}`;
    return { ok: true as const };
  });

export const removeBook = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from books where id = ${data.id}`;
    if (!rows[0]) return { ok: true as const };
    await canControl(context.userId, "biblioteca", rows[0].created_by);
    await sql`delete from books where id = ${data.id}`;
    return { ok: true as const };
  });

export const removeRide = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from rides where id = ${data.id}`;
    if (!rows[0]) return { ok: true as const };
    await canControl(context.userId, "rutas", rows[0].created_by);
    await sql`delete from rides where id = ${data.id}`;
    return { ok: true as const };
  });

export const removeGroup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from study_groups where id = ${data.id}`;
    if (!rows[0]) return { ok: true as const };
    await canControl(context.userId, "mesas", rows[0].created_by);
    await sql`delete from study_groups where id = ${data.id}`;
    return { ok: true as const };
  });

export const removeNotice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from notices where id = ${data.id}`;
    if (!rows[0]) return { ok: true as const };
    await canControl(context.userId, "mural", rows[0].created_by);
    await sql`delete from notices where id = ${data.id}`;
    return { ok: true as const };
  });
