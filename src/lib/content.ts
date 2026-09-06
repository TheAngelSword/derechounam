import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type {
  BitacoraPost,
  Board,
  BookItem,
  ClassMaterial,
  Course,
  EventItem,
  Notice,
  Professor,
  RideItem,
  ServiceOffer,
  StudyGroup,
} from "@/lib/types";

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

async function canEditOwnedOrModerator(userId: string, createdBy: string) {
  const me = await activeMember(userId);
  if (createdBy === userId || me.role === "moderador") return me;
  throw new Error("Solo el autor de la publicación o un administrador puede editarla");
}

function asIsoDate(value: unknown) {
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

export const loadBoard = createServerFn({ method: "GET" }).handler(async (): Promise<Board> => {
  const sql = await getSql();
  const [professors, courses, events, books, rides, groups, notices, posts, materials, services] = await Promise.all([
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
      created_by: string;
    }>`select id, title, kind, event_date, time_slot, place, modality, description, host_alias, created_by from events order by event_date, time_slot`,
    sql<{
      id: number;
      title: string;
      author: string;
      kind: string;
      course: string | null;
      notes: string;
      owner_alias: string;
      publisher: string | null;
      publication_year: string | null;
      edition: string | null;
      isbn: string | null;
      file_url: string | null;
      file_name: string | null;
      external_url: string | null;
      commerce_url: string | null;
      price_text: string | null;
      created_by: string;
    }>`select id, title, author, kind, course, notes, owner_alias, publisher, publication_year, edition, isbn, file_url, file_name, external_url, commerce_url, price_text, created_by from books order by id desc`,
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
      created_by: string;
    }>`select id, direction, from_place, to_place, weekday, time_slot, seats, notes, owner_alias, created_by from rides order by weekday, time_slot`,
    sql<{
      id: number;
      name: string;
      course: string;
      when_text: string;
      place: string;
      notes: string;
      created_by: string;
    }>`select id, name, course, when_text, place, notes, created_by from study_groups order by id`,
    sql<{
      id: number;
      title: string;
      body: string;
      pinned: boolean;
      created_at: string;
      created_by: string;
    }>`select id, title, body, pinned, created_at, created_by from notices order by pinned desc, created_at desc`,
    sql<{
      id: number;
      title: string;
      body: string;
      image_url: string | null;
      image_name: string | null;
      shot_date: string | null;
      place: string | null;
      author_alias: string;
      created_at: string;
      created_by: string;
    }>`select id, title, body, image_url, image_name, shot_date, place, author_alias, created_at, created_by from class_posts order by created_at desc, id desc`,
    sql<{
      id: number;
      course_code: string;
      course_name: string;
      class_date: string;
      kind: string;
      title: string;
      body: string;
      file_url: string | null;
      file_name: string | null;
      external_url: string | null;
      author_alias: string;
      created_at: string;
      created_by: string;
    }>`select id, course_code, course_name, class_date, kind, title, body, file_url, file_name, external_url, author_alias, created_at, created_by from class_materials order by class_date desc, created_at desc`,
    sql<{
      id: number;
      title: string;
      category: string;
      description: string;
      price_text: string;
      availability_days: string;
      delivery_place: string;
      order_cutoff: string | null;
      how_to_order: string;
      image_url: string | null;
      image_name: string | null;
      seller_alias: string;
      created_at: string;
      created_by: string;
    }>`select id, title, category, description, price_text, availability_days, delivery_place, order_cutoff, how_to_order, image_url, image_name, seller_alias, created_at, created_by from service_offers order by created_at desc, id desc`,
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
      createdBy: row.created_by,
    })) satisfies EventItem[],
    books: books.map((row) => ({
      id: row.id,
      title: row.title,
      author: row.author,
      kind: row.kind,
      course: row.course,
      notes: row.notes,
      ownerAlias: row.owner_alias,
      publisher: row.publisher,
      publicationYear: row.publication_year,
      edition: row.edition,
      isbn: row.isbn,
      fileUrl: row.file_url,
      fileName: row.file_name,
      externalUrl: row.external_url,
      commerceUrl: row.commerce_url,
      priceText: row.price_text,
      createdBy: row.created_by,
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
      createdBy: row.created_by,
    })) satisfies RideItem[],
    groups: groups.map((row) => ({
      id: row.id,
      name: row.name,
      course: row.course,
      whenText: row.when_text,
      place: row.place,
      notes: row.notes,
      createdBy: row.created_by,
    })) satisfies StudyGroup[],
    notices: notices.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      pinned: Boolean(row.pinned),
      createdAt: String(row.created_at),
      createdBy: row.created_by,
    })) satisfies Notice[],
    posts: posts.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      imageUrl: row.image_url,
      imageName: row.image_name,
      shotDate: row.shot_date ? asIsoDate(row.shot_date) : null,
      place: row.place,
      authorAlias: row.author_alias,
      createdAt: String(row.created_at),
      createdBy: row.created_by,
    })) satisfies BitacoraPost[],
    materials: materials.map((row) => ({
      id: row.id,
      courseCode: row.course_code,
      courseName: row.course_name,
      classDate: asIsoDate(row.class_date),
      kind: row.kind as ClassMaterial["kind"],
      title: row.title,
      body: row.body,
      fileUrl: row.file_url,
      fileName: row.file_name,
      externalUrl: row.external_url,
      authorAlias: row.author_alias,
      createdAt: String(row.created_at),
      createdBy: row.created_by,
    })) satisfies ClassMaterial[],
    services: services.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category as ServiceOffer["category"],
      description: row.description,
      priceText: row.price_text,
      availabilityDays: row.availability_days,
      deliveryPlace: row.delivery_place,
      orderCutoff: row.order_cutoff,
      howToOrder: row.how_to_order,
      imageUrl: row.image_url,
      imageName: row.image_name,
      sellerAlias: row.seller_alias,
      createdAt: String(row.created_at),
      createdBy: row.created_by,
    })) satisfies ServiceOffer[],
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
    if (me.role === "alumno") throw new Error("Solo cátedra o moderación sube horarios");
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

const eventInputSchema = z.object({
  title: short,
  kind: z.enum(["Taller", "Conferencia", "Actividad", "Clínica", "Social"]),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.string().trim().min(4).max(24),
  place: short,
  modality: z.enum(["Presencial", "En línea", "Híbrido"]),
  description: mid,
  hostAlias: short,
});

export const addEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(eventInputSchema)
  .handler(async ({ context, data }) => {
    await activeMember(context.userId);
    const sql = await getSql();
    await sql`insert into events (title, kind, event_date, time_slot, place, modality, description, host_alias, created_by)
      values (${data.title}, ${data.kind}, ${data.eventDate}, ${data.timeSlot}, ${data.place}, ${data.modality}, ${data.description}, ${data.hostAlias}, ${context.userId})`;
    return { ok: true as const };
  });

const optionalUrl = z.union([z.literal(""), z.string().url().max(1500)]).optional();
const bookTitle = z.string().trim().min(2).max(300);
const bookAuthor = z.string().trim().min(2).max(400);

const bookInputSchema = z.object({
  title: bookTitle,
  author: bookAuthor,
  kind: z.enum(["Bibliografía", "Préstamo", "Venta", "Recomendación", "Descarga"]),
  course: z.string().trim().max(180).optional(),
  notes: z.string().trim().max(1800).optional(),
  ownerAlias: z.string().trim().max(160).optional(),
  publisher: z.string().trim().max(240).optional(),
  publicationYear: z.string().trim().max(40).optional(),
  edition: z.string().trim().max(240).optional(),
  isbn: z.string().trim().max(80).optional(),
  fileUrl: optionalUrl,
  fileName: z.string().trim().max(220).optional(),
  externalUrl: optionalUrl,
  commerceUrl: optionalUrl,
  priceText: z.string().trim().max(120).optional(),
});

export const addBook = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(bookInputSchema)
  .handler(async ({ context, data }) => {
    await activeMember(context.userId);
    const sql = await getSql();
    await sql`insert into books (
      title, author, kind, course, notes, owner_alias, publisher, publication_year, edition, isbn,
      file_url, file_name, external_url, commerce_url, price_text, created_by
    ) values (
      ${data.title}, ${data.author}, ${data.kind}, ${data.course || null}, ${data.notes || ""}, ${data.ownerAlias || "Biblioteca 9114"},
      ${data.publisher || null}, ${data.publicationYear || null}, ${data.edition || null}, ${data.isbn || null},
      ${data.fileUrl || null}, ${data.fileName || null}, ${data.externalUrl || null}, ${data.commerceUrl || null}, ${data.priceText || null}, ${context.userId}
    )`;
    return { ok: true as const };
  });

const rideInputSchema = z.object({
  direction: z.enum(["Ida", "Vuelta"]),
  fromPlace: short,
  toPlace: short,
  weekday: z.enum(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]),
  timeSlot: z.string().trim().min(4).max(16),
  seats: z.number().int().min(1).max(6),
  notes: mid,
  ownerAlias: short,
});

export const addRide = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(rideInputSchema)
  .handler(async ({ context, data }) => {
    await activeMember(context.userId);
    const sql = await getSql();
    await sql`insert into rides (direction, from_place, to_place, weekday, time_slot, seats, notes, owner_alias, created_by)
      values (${data.direction}, ${data.fromPlace}, ${data.toPlace}, ${data.weekday}, ${data.timeSlot}, ${data.seats}, ${data.notes}, ${data.ownerAlias}, ${context.userId})`;
    return { ok: true as const };
  });

const groupInputSchema = z.object({
  name: short,
  course: short,
  whenText: short,
  place: short,
  notes: mid,
});

export const addGroup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(groupInputSchema)
  .handler(async ({ context, data }) => {
    await activeMember(context.userId);
    const sql = await getSql();
    await sql`insert into study_groups (name, course, when_text, place, notes, created_by)
      values (${data.name}, ${data.course}, ${data.whenText}, ${data.place}, ${data.notes}, ${context.userId})`;
    return { ok: true as const };
  });

const noticeInputSchema = z.object({ title: short, body: mid });

export const addNotice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(noticeInputSchema)
  .handler(async ({ context, data }) => {
    await activeMember(context.userId);
    const sql = await getSql();
    await sql`insert into notices (title, body, pinned, created_by)
      values (${data.title}, ${data.body}, false, ${context.userId})`;
    return { ok: true as const };
  });


const bitacoraInputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(3).max(900),
  imageUrl: optionalUrl,
  imageName: z.string().trim().max(220).optional(),
  shotDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
  place: z.string().trim().max(120).optional(),
});

export const addBitacoraPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(bitacoraInputSchema)
  .handler(async ({ context, data }) => {
    const me = await activeMember(context.userId);
    const sql = await getSql();
    await sql`insert into class_posts (title, body, image_url, image_name, shot_date, place, author_alias, created_by)
      values (${data.title}, ${data.body}, ${data.imageUrl || null}, ${data.imageName || null}, ${data.shotDate || null}, ${data.place || null}, ${me.alias}, ${context.userId})`;
    return { ok: true as const };
  });


const classMaterialInputSchema = z.object({
  courseCode: z.string().trim().min(2).max(12),
  courseName: z.string().trim().min(2).max(180),
  classDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: z.enum(["Apuntes", "Tarea", "Foto", "Material", "Aviso"]),
  title: z.string().trim().min(2).max(240),
  body: z.string().trim().min(3).max(2400),
  fileUrl: optionalUrl,
  fileName: z.string().trim().max(220).optional(),
  externalUrl: optionalUrl,
});

export const addClassMaterial = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(classMaterialInputSchema)
  .handler(async ({ context, data }) => {
    const me = await activeMember(context.userId);
    const sql = await getSql();
    await sql`insert into class_materials (course_code, course_name, class_date, kind, title, body, file_url, file_name, external_url, author_alias, created_by)
      values (${data.courseCode}, ${data.courseName}, ${data.classDate}, ${data.kind}, ${data.title}, ${data.body}, ${data.fileUrl || null}, ${data.fileName || null}, ${data.externalUrl || null}, ${me.alias}, ${context.userId})`;
    return { ok: true as const };
  });


const serviceInputSchema = z.object({
  title: z.string().trim().min(2).max(180),
  category: z.enum(["Desayuno", "Comida", "Sándwiches", "Postres", "Bebidas", "Otro"]),
  description: z.string().trim().min(3).max(1800),
  priceText: z.string().trim().min(1).max(80),
  availabilityDays: z.string().trim().min(2).max(180),
  deliveryPlace: z.string().trim().min(2).max(180),
  orderCutoff: z.string().trim().max(120).optional(),
  howToOrder: z.string().trim().min(2).max(600),
  imageUrl: optionalUrl,
  imageName: z.string().trim().max(220).optional(),
});

export const addServiceOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(serviceInputSchema)
  .handler(async ({ context, data }) => {
    const me = await activeMember(context.userId);
    const sql = await getSql();
    await sql`insert into service_offers (title, category, description, price_text, availability_days, delivery_place, order_cutoff, how_to_order, image_url, image_name, seller_alias, created_by)
      values (${data.title}, ${data.category}, ${data.description}, ${data.priceText}, ${data.availabilityDays}, ${data.deliveryPlace}, ${data.orderCutoff || null}, ${data.howToOrder}, ${data.imageUrl || null}, ${data.imageName || null}, ${me.alias}, ${context.userId})`;
    return { ok: true as const };
  });


export const updateEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(eventInputSchema.extend({ id: z.number().int().positive() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from events where id = ${data.id} limit 1`;
    if (!rows[0]) throw new Error("Publicación no encontrada");
    await canEditOwnedOrModerator(context.userId, rows[0].created_by);
    await sql`update events set title = ${data.title}, kind = ${data.kind}, event_date = ${data.eventDate}, time_slot = ${data.timeSlot},
      place = ${data.place}, modality = ${data.modality}, description = ${data.description}, host_alias = ${data.hostAlias}
      where id = ${data.id}`;
    return { ok: true as const };
  });

export const updateRide = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(rideInputSchema.extend({ id: z.number().int().positive() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from rides where id = ${data.id} limit 1`;
    if (!rows[0]) throw new Error("Publicación no encontrada");
    await canEditOwnedOrModerator(context.userId, rows[0].created_by);
    await sql`update rides set direction = ${data.direction}, from_place = ${data.fromPlace}, to_place = ${data.toPlace}, weekday = ${data.weekday},
      time_slot = ${data.timeSlot}, seats = ${data.seats}, notes = ${data.notes}, owner_alias = ${data.ownerAlias}
      where id = ${data.id}`;
    return { ok: true as const };
  });

export const updateGroup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(groupInputSchema.extend({ id: z.number().int().positive() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from study_groups where id = ${data.id} limit 1`;
    if (!rows[0]) throw new Error("Publicación no encontrada");
    await canEditOwnedOrModerator(context.userId, rows[0].created_by);
    await sql`update study_groups set name = ${data.name}, course = ${data.course}, when_text = ${data.whenText}, place = ${data.place}, notes = ${data.notes}
      where id = ${data.id}`;
    return { ok: true as const };
  });

export const updateNotice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(noticeInputSchema.extend({ id: z.number().int().positive() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from notices where id = ${data.id} limit 1`;
    if (!rows[0]) throw new Error("Publicación no encontrada");
    await canEditOwnedOrModerator(context.userId, rows[0].created_by);
    await sql`update notices set title = ${data.title}, body = ${data.body} where id = ${data.id}`;
    return { ok: true as const };
  });

export const updateBook = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(bookInputSchema.extend({ id: z.number().int().positive() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from books where id = ${data.id} limit 1`;
    if (!rows[0]) throw new Error("Publicación no encontrada");
    await canEditOwnedOrModerator(context.userId, rows[0].created_by);
    await sql`update books set
      title = ${data.title}, author = ${data.author}, kind = ${data.kind}, course = ${data.course || null},
      notes = ${data.notes || ""}, owner_alias = ${data.ownerAlias || "Biblioteca 9114"}, publisher = ${data.publisher || null},
      publication_year = ${data.publicationYear || null}, edition = ${data.edition || null}, isbn = ${data.isbn || null},
      file_url = ${data.fileUrl || null}, file_name = ${data.fileName || null}, external_url = ${data.externalUrl || null},
      commerce_url = ${data.commerceUrl || null}, price_text = ${data.priceText || null}
      where id = ${data.id}`;
    return { ok: true as const };
  });

export const updateBitacoraPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(bitacoraInputSchema.extend({ id: z.number().int().positive() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from class_posts where id = ${data.id} limit 1`;
    if (!rows[0]) throw new Error("Publicación no encontrada");
    await canEditOwnedOrModerator(context.userId, rows[0].created_by);
    await sql`update class_posts set
      title = ${data.title}, body = ${data.body}, image_url = ${data.imageUrl || null}, image_name = ${data.imageName || null},
      shot_date = ${data.shotDate || null}, place = ${data.place || null}
      where id = ${data.id}`;
    return { ok: true as const };
  });

export const updateClassMaterial = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(classMaterialInputSchema.extend({ id: z.number().int().positive() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from class_materials where id = ${data.id} limit 1`;
    if (!rows[0]) throw new Error("Publicación no encontrada");
    await canEditOwnedOrModerator(context.userId, rows[0].created_by);
    await sql`update class_materials set
      course_code = ${data.courseCode}, course_name = ${data.courseName}, class_date = ${data.classDate}, kind = ${data.kind},
      title = ${data.title}, body = ${data.body}, file_url = ${data.fileUrl || null}, file_name = ${data.fileName || null},
      external_url = ${data.externalUrl || null}
      where id = ${data.id}`;
    return { ok: true as const };
  });

export const updateServiceOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(serviceInputSchema.extend({ id: z.number().int().positive() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from service_offers where id = ${data.id} limit 1`;
    if (!rows[0]) throw new Error("Publicación no encontrada");
    await canEditOwnedOrModerator(context.userId, rows[0].created_by);
    await sql`update service_offers set
      title = ${data.title}, category = ${data.category}, description = ${data.description}, price_text = ${data.priceText},
      availability_days = ${data.availabilityDays}, delivery_place = ${data.deliveryPlace}, order_cutoff = ${data.orderCutoff || null},
      how_to_order = ${data.howToOrder}, image_url = ${data.imageUrl || null}, image_name = ${data.imageName || null}
      where id = ${data.id}`;
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

export const removeBitacoraPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from class_posts where id = ${data.id}`;
    if (!rows[0]) return { ok: true as const };
    await canControl(context.userId, "bitacora", rows[0].created_by);
    await sql`delete from class_posts where id = ${data.id}`;
    return { ok: true as const };
  });

export const removeClassMaterial = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from class_materials where id = ${data.id}`;
    if (!rows[0]) return { ok: true as const };
    await canControl(context.userId, "catedras", rows[0].created_by);
    await sql`delete from class_materials where id = ${data.id}`;
    return { ok: true as const };
  });

export const removeServiceOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ created_by: string }>`select created_by from service_offers where id = ${data.id}`;
    if (!rows[0]) return { ok: true as const };
    await canControl(context.userId, "servicios", rows[0].created_by);
    await sql`delete from service_offers where id = ${data.id}`;
    return { ok: true as const };
  });
