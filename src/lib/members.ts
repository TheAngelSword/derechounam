import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export const AREAS = [
  { id: "clases", label: "Horarios" },
  { id: "catedras", label: "Cátedras" },
  { id: "agenda", label: "Agenda" },
  { id: "biblioteca", label: "Biblioteca" },
  { id: "rutas", label: "Rutas" },
  { id: "mesas", label: "Mesas" },
  { id: "mural", label: "Mural" },
  { id: "bitacora", label: "Bitácora" },
] as const;

export type AreaId = (typeof AREAS)[number]["id"];

export type Member = {
  userId: string;
  alias: string;
  role: "alumno" | "profesor" | "moderador";
  groupCode: string;
  status: "pendiente" | "activo" | "suspendido";
  createdAt: string;
};

export type AreaMod = {
  userId: string;
  alias: string;
  area: string;
};

export type AccessEntry = {
  id: number;
  userId: string;
  alias: string;
  area: string;
  action: string;
  createdAt: string;
};

export type Directory = {
  me: Member | null;
  members: Member[];
  mods: AreaMod[];
  access: AccessEntry[];
};

const roleSchema = z.enum(["alumno", "profesor", "moderador"]);
const statusSchema = z.enum(["pendiente", "activo", "suspendido"]);
const areaSchema = z.enum(["clases", "catedras", "agenda", "biblioteca", "rutas", "mesas", "mural", "bitacora"]);

function mapMember(row: {
  user_id: string;
  alias: string;
  role: string;
  group_code: string;
  status: string;
  created_at: string;
}): Member {
  return {
    userId: row.user_id,
    alias: row.alias,
    role: row.role as Member["role"],
    groupCode: row.group_code,
    status: row.status as Member["status"],
    createdAt: String(row.created_at),
  };
}

async function loadMember(userId: string): Promise<Member | null> {
  const sql = await getSql();
  const rows = await sql<{
    user_id: string;
    alias: string;
    role: string;
    group_code: string;
    status: string;
    created_at: string;
  }>`select user_id, alias, role, group_code, status, created_at from members where user_id = ${userId} limit 1`;
  return rows[0] ? mapMember(rows[0]) : null;
}

export const loadDirectory = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Directory> => {
    const sql = await getSql();
    const [me, members, mods, access] = await Promise.all([
      loadMember(context.userId),
      sql<{
        user_id: string;
        alias: string;
        role: string;
        group_code: string;
        status: string;
        created_at: string;
      }>`select user_id, alias, role, group_code, status, created_at from members order by role, alias`,
      sql<{
        user_id: string;
        alias: string;
        area: string;
      }>`select area_mods.user_id, members.alias, area_mods.area
         from area_mods
         join members on members.user_id = area_mods.user_id
         order by area_mods.area, members.alias`,
      sql<{
        id: number;
        user_id: string;
        alias: string;
        area: string;
        action: string;
        created_at: string;
      }>`select id, user_id, alias, area, action, created_at from access_log order by created_at desc limit 40`,
    ]);
    if (!me) return { me: null, members: [], mods: [], access: [] };
    if (me.status !== "activo") return { me, members: [], mods: [], access: [] };
    const isMod = me.role === "moderador";
    return {
      me,
      members: members.map(mapMember),
      mods: mods.map((row) => ({ userId: row.user_id, alias: row.alias, area: row.area })),
      access: isMod
        ? access.map((row) => ({
            id: row.id,
            userId: row.user_id,
            alias: row.alias,
            area: row.area,
            action: row.action,
            createdAt: String(row.created_at),
          }))
        : [],
    };
  });

export const registerMember = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      alias: z.string().trim().min(2).max(40),
      role: z.enum(["alumno", "profesor"]).optional(),
    }),
  )
  .handler(async ({ context, data }): Promise<Member> => {
    const existing = await loadMember(context.userId);
    if (existing) return existing;
    const sql = await getSql();
    const countRows = await sql<{ n: number }>`select count(*)::int as n from members`;
    const isFirstMember = countRows[0]?.n === 0;
    const role = isFirstMember ? "moderador" : "alumno";
    const status = isFirstMember ? "activo" : "pendiente";
    await sql`insert into members (user_id, alias, role, group_code, status)
      values (${context.userId}, ${data.alias}, ${role}, ${"9114"}, ${status})`;
    const created = await loadMember(context.userId);
    if (!created) throw new Error("No se pudo registrar");
    return created;
  });

export const setMemberStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string().min(1), status: statusSchema }))
  .handler(async ({ context, data }) => {
    const me = await loadMember(context.userId);
    if (!me || me.role !== "moderador" || me.status !== "activo") {
      throw new Error("Solo un moderador activo puede cambiar el estado");
    }
    if (data.userId === context.userId) throw new Error("No puedes suspenderte");
    const sql = await getSql();
    await sql`update members set status = ${data.status} where user_id = ${data.userId}`;
    return { ok: true as const };
  });

export const setMemberRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string().min(1), role: roleSchema }))
  .handler(async ({ context, data }) => {
    const me = await loadMember(context.userId);
    if (!me || me.role !== "moderador" || me.status !== "activo") {
      throw new Error("Solo un moderador activo puede cambiar el rol");
    }
    const sql = await getSql();
    await sql`update members set role = ${data.role} where user_id = ${data.userId}`;
    return { ok: true as const };
  });

export const assignAreaMod = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string().min(1), area: areaSchema }))
  .handler(async ({ context, data }) => {
    const me = await loadMember(context.userId);
    if (!me || me.role !== "moderador" || me.status !== "activo") {
      throw new Error("Solo un moderador activo asigna áreas");
    }
    const sql = await getSql();
    await sql`insert into area_mods (user_id, area) values (${data.userId}, ${data.area})
      on conflict (user_id, area) do nothing`;
    return { ok: true as const };
  });

export const revokeAreaMod = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: z.string().min(1), area: areaSchema }))
  .handler(async ({ context, data }) => {
    const me = await loadMember(context.userId);
    if (!me || me.role !== "moderador" || me.status !== "activo") {
      throw new Error("Solo un moderador activo retira áreas");
    }
    const sql = await getSql();
    await sql`delete from area_mods where user_id = ${data.userId} and area = ${data.area}`;
    return { ok: true as const };
  });

export const logAccess = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ area: areaSchema, action: z.enum(["entrada", "publicar"]) }))
  .handler(async ({ context, data }) => {
    const me = await loadMember(context.userId);
    if (!me || me.status !== "activo") return { ok: false as const };
    const sql = await getSql();
    await sql`insert into access_log (user_id, alias, area, action)
      values (${context.userId}, ${me.alias}, ${data.area}, ${data.action})`;
    return { ok: true as const };
  });
