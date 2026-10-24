import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { savePersonalSchema } from "./model";

async function personalUser(userId: string): Promise<string> {
  const { setResponseHeader } = await import("@tanstack/react-start/server");
  const { requirePersonalSite } = await import("./guard.server");
  setResponseHeader("Cache-Control", "private, no-store");
  await requirePersonalSite();
  return userId;
}

export const siteShell = createServerFn({ method: "GET" }).handler(async () => {
  const { requestSite } = await import("./request.server");
  return requestSite();
});

export const personalAccess = createServerFn({ method: "GET" }).handler(async () => {
  const { accessState } = await import("./guard.server");
  const { setResponseHeader } = await import("@tanstack/react-start/server");
  setResponseHeader("Cache-Control", "private, no-store");
  return accessState();
});

export const loadPersonal = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
  const userId = await personalUser(context.userId);
  const service = await import("./service.server");
  return { items: await service.listItems(userId), ...service.integrationStatus() };
});

export const savePersonal = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(savePersonalSchema).handler(async ({ context, data }) => {
  const userId = await personalUser(context.userId);
  const { saveItem } = await import("./service.server");
  return saveItem(userId, data);
});

export const setPersonalStatus = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(z.object({ id: z.string().uuid(), status: z.enum(["pendiente", "hecho", "archivado"]) })).handler(async ({ context, data }) => {
  const userId = await personalUser(context.userId);
  const { setStatus } = await import("./service.server");
  await setStatus(userId, data.id, data.status);
  return { ok: true as const };
});

export const deletePersonal = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(z.object({ id: z.string().uuid() })).handler(async ({ context, data }) => {
  const userId = await personalUser(context.userId);
  const { removeItem } = await import("./service.server");
  await removeItem(userId, data.id);
  return { ok: true as const };
});

export const reviewPersonal = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(z.object({ id: z.string().uuid(), grade: z.enum(["otra", "dificil", "bien", "facil"]) })).handler(async ({ context, data }) => {
  const userId = await personalUser(context.userId);
  const { reviewItem } = await import("./service.server");
  return reviewItem(userId, data.id, data.grade);
});

export const progressPersonal = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(z.object({ id: z.string().uuid(), current: z.number().int().min(0).max(100000) })).handler(async ({ context, data }) => {
  const userId = await personalUser(context.userId);
  const { setProgress } = await import("./service.server");
  return setProgress(userId, data.id, data.current);
});

export const sendPersonalTest = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
  await personalUser(context.userId);
  const { sendTestMessage } = await import("./service.server");
  return sendTestMessage();
});

export const runPersonalReminders = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
  await personalUser(context.userId);
  const { dispatchReminders } = await import("./service.server");
  return dispatchReminders();
});
