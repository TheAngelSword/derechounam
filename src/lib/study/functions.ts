import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { validateProgress, type StudyProgress } from "./progress";
export type ProgressRecord = { progress: StudyProgress; revision: number };
export const loadStudyProgress = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }): Promise<ProgressRecord> => {
  const sql = await getSql();
  const [row] = await sql<ProgressRecord>`select progress, revision from study_progress where user_id = ${context.userId}`;
  return row ?? { progress: {}, revision: 0 };
});
export const saveStudyProgress = createServerFn({ method: "POST" }).middleware([authMiddleware])
  .validator(z.object({ progress: z.record(z.string(),z.object({ status: z.enum(["pendiente","cursando","aprobada"]), semester: z.union([z.literal(9),z.literal(10)]).optional() })), revision: z.number().int().min(0) }))
  .handler(async ({ context, data }): Promise<ProgressRecord> => {
    const progress = validateProgress(data.progress);
    const sql = await getSql();
    const members = await sql<{status:string}>`select status from members where user_id=${context.userId}`;
    if (members[0]?.status !== "activo") throw new Error("Se requiere un registro activo para guardar el avance.");
    const json = JSON.stringify(progress);
    const rows = data.revision === 0
      ? await sql<ProgressRecord>`insert into study_progress(user_id,progress) values(${context.userId},${json}::jsonb) on conflict do nothing returning progress, revision`
      : await sql<ProgressRecord>`update study_progress set progress=${json}::jsonb,revision=revision+1,updated_at=now() where user_id=${context.userId} and revision=${data.revision} returning progress, revision`;
    if (!rows[0]) throw new Error("El avance cambió en otra pestaña. Recarga el plan antes de guardar otra vez.");
    return rows[0];
  });
