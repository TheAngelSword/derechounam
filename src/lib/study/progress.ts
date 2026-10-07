import { PLAN_COURSES } from "./plan.ts";
export type CourseStatus = "pendiente" | "cursando" | "aprobada";
export type ProgressEntry = { status: CourseStatus; semester?: 9 | 10 };
export type StudyProgress = Record<string, ProgressEntry>;
export function validateProgress(value: unknown): StudyProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Avance no válido.");
  const result: StudyProgress = {};
  let nine = 0, ten = 0;
  for (const [id, entry] of Object.entries(value)) {
    const course = PLAN_COURSES.find((item) => item.id === id);
    if (!course || !entry || typeof entry !== "object") throw new Error("Materia no válida.");
    const { status, semester } = entry as ProgressEntry;
    if (!["pendiente", "cursando", "aprobada"].includes(status)) throw new Error("Estado no válido.");
    if (course.kind === "optativa") {
      if (semester !== 9 && semester !== 10) throw new Error("Asigna la optativa al semestre 9 o 10.");
      if (semester === 9) nine++; else ten++;
      result[id] = { status, semester };
    } else result[id] = { status };
  }
  if (nine > 6 || ten > 6) throw new Error("El plan reserva seis optativas en noveno y seis en décimo. Quita una antes de elegir otra.");
  return result;
}
export function summarizeProgress(progress: StudyProgress) {
  const passed = PLAN_COURSES.filter((c) => progress[c.id]?.status === "aprobada");
  const requiredCredits = passed.filter((c) => c.kind === "obligatoria").reduce((n,c) => n+c.credits,0);
  const electiveCredits = Math.min(84, passed.filter((c) => c.kind === "optativa" && [9,10].includes(progress[c.id]?.semester ?? 0)).reduce((n,c) => n+c.credits,0));
  return { requiredCredits, electiveCredits, credits: requiredCredits + electiveCredits, passed: passed.length, percent: Math.round((requiredCredits + electiveCredits) / 450 * 100) };
}
export function missingPrerequisites(id: string, progress: StudyProgress) {
  return PLAN_COURSES.find((c) => c.id === id)?.prerequisites.filter((code) => progress[code]?.status !== "aprobada") ?? [];
}
