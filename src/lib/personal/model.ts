import { z } from "zod";
import { combineMexico } from "./dates.ts";
import { initialSrs, type SrsState } from "./srs.ts";

export const PERSONAL_KINDS = ["tarea", "examen", "actividad", "diplomado", "repaso", "lectura", "clase", "reunion", "compromiso"] as const;
export type PersonalKind = (typeof PERSONAL_KINDS)[number];

export const KIND_LABEL: Record<PersonalKind, string> = {
  tarea: "Tarea",
  examen: "Examen",
  actividad: "Actividad",
  diplomado: "Diplomado",
  repaso: "Repaso",
  lectura: "Lectura",
  clase: "Clase",
  reunion: "Reunión",
  compromiso: "Compromiso",
};

export const REMINDER_CHOICES = [
  { minutes: 10080, label: "1 semana antes" },
  { minutes: 2880, label: "2 días antes" },
  { minutes: 1440, label: "1 día antes" },
  { minutes: 180, label: "3 horas antes" },
  { minutes: 60, label: "1 hora antes" },
  { minutes: 15, label: "15 minutos antes" },
] as const;

const ALLOWED_MINUTES = new Set<number>(REMINDER_CHOICES.map((choice) => choice.minutes));

export const PRIORITIES = ["normal", "importante", "critico"] as const;
export type PersonalPriority = (typeof PRIORITIES)[number];
export const STATUSES = ["pendiente", "hecho", "archivado"] as const;
export type PersonalStatus = (typeof STATUSES)[number];
export const PROGRESS_UNITS = ["paginas", "minutos", "capitulos", "porcentaje"] as const;
export type ProgressUnit = (typeof PROGRESS_UNITS)[number];

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();
const timeField = z.string().regex(/^\d{2}:\d{2}$/).nullable();

export const savePersonalSchema = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(PERSONAL_KINDS),
  title: z.string().trim().min(2).max(180),
  notes: z.string().trim().max(4000).default(""),
  subject: z.string().trim().max(120).default(""),
  location: z.string().trim().max(200).default(""),
  url: z.string().trim().max(500).default(""),
  date: dateField.default(null),
  time: timeField.default(null),
  allDay: z.boolean().default(false),
  priority: z.enum(PRIORITIES).default("normal"),
  reminderMinutes: z.array(z.number().int()).max(6).default([1440, 60]),
  progressCurrent: z.number().int().min(0).max(100000).default(0),
  progressTotal: z.number().int().min(0).max(100000).default(0),
  progressUnit: z.enum(PROGRESS_UNITS).default("paginas"),
});

export type SavePersonalInput = z.infer<typeof savePersonalSchema>;

export type PersonalItem = {
  id: string;
  kind: PersonalKind;
  title: string;
  notes: string;
  subject: string;
  location: string;
  url: string;
  startsAt: string | null;
  endsAt: string | null;
  dueAt: string | null;
  allDay: boolean;
  priority: PersonalPriority;
  status: PersonalStatus;
  reminderMinutes: number[];
  ease: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string | null;
  progressCurrent: number;
  progressTotal: number;
  progressUnit: ProgressUnit;
  updatedAt: string;
};

export function cleanReminders(values: number[]): number[] {
  const unique = [...new Set(values.filter((value) => ALLOWED_MINUTES.has(value)))];
  unique.sort((a, b) => b - a);
  return unique.slice(0, 6);
}

export function reminderLabel(minutes: number): string {
  return REMINDER_CHOICES.find((choice) => choice.minutes === minutes)?.label ?? `${minutes} min antes`;
}

const EVENT_KINDS = new Set<PersonalKind>(["examen", "actividad", "diplomado", "clase", "reunion", "compromiso"]);

export function scheduleFromInput(input: Pick<SavePersonalInput, "kind" | "date" | "time" | "allDay">, now = new Date()): {
  startsAt: string | null;
  endsAt: string | null;
  dueAt: string | null;
  nextReviewAt: string | null;
  allDay: boolean;
} {
  const wall = combineMexico(input.date, input.time, input.allDay || !input.time);
  if (input.kind === "repaso") {
    const next = wall.start ?? combineMexico(mexicoToday(now), null, true).start;
    return { startsAt: null, endsAt: null, dueAt: null, nextReviewAt: next, allDay: true };
  }
  if (input.kind === "lectura" || input.kind === "tarea") {
    return { startsAt: null, endsAt: wall.end, dueAt: wall.start, nextReviewAt: null, allDay: wall.allDay && Boolean(wall.start) };
  }
  if (EVENT_KINDS.has(input.kind)) {
    return { startsAt: wall.start, endsAt: wall.end, dueAt: null, nextReviewAt: null, allDay: wall.allDay && Boolean(wall.start) };
  }
  return { startsAt: wall.start, endsAt: wall.end, dueAt: null, nextReviewAt: null, allDay: wall.allDay && Boolean(wall.start) };
}

function mexicoToday(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function anchorOf(item: Pick<PersonalItem, "kind" | "startsAt" | "dueAt" | "nextReviewAt">): string | null {
  if (item.kind === "repaso") return item.nextReviewAt;
  if (item.kind === "tarea" || item.kind === "lectura") return item.dueAt ?? item.startsAt;
  return item.startsAt ?? item.dueAt ?? item.nextReviewAt;
}

export function isHighlighted(item: Pick<PersonalItem, "kind" | "priority" | "status" | "startsAt" | "dueAt" | "nextReviewAt">): boolean {
  if (item.status !== "pendiente") return false;
  if (item.priority === "importante" || item.priority === "critico") return true;
  if ((item.kind === "tarea" || item.kind === "examen") && anchorOf(item)) return true;
  return false;
}

export function blankSrs(): SrsState {
  return initialSrs();
}
