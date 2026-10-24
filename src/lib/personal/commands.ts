import { addCalendarDays, mexicoDayStartUtc, mexicoParts, mexicoWallToUtc, type MexicoParts } from "./dates.ts";
import type { PersonalKind } from "./model.ts";

export type InboundCommand =
  | { type: "help" }
  | { type: "list"; range: "hoy" | "semana" }
  | { type: "add"; kind: PersonalKind; title: string; date: string | null; time: string | null; allDay: boolean };

const KIND_WORDS: Record<string, PersonalKind> = {
  tarea: "tarea",
  examen: "examen",
  actividad: "actividad",
  diplomado: "diplomado",
  repaso: "repaso",
  lectura: "lectura",
  audiolibro: "lectura",
  libro: "lectura",
  clase: "clase",
  reunion: "reunion",
  junta: "reunion",
  compromiso: "compromiso",
};

const WEEKDAYS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function plain(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function ymd(parts: Pick<MexicoParts, "year" | "month" | "day">): string {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function nextWeekday(today: MexicoParts, target: number): string {
  const delta = (target - today.weekday + 7) % 7;
  return ymd(addCalendarDays(today, delta === 0 ? 0 : delta));
}

function parseDatePhrase(phrase: string, today: MexicoParts): string | null {
  const text = plain(phrase).trim();
  if (!text) return null;
  if (text === "hoy") return ymd(today);
  if (text === "manana") return ymd(addCalendarDays(today, 1));
  if (text === "pasado manana") return ymd(addCalendarDays(today, 2));
  const inDays = text.match(/^en\s+(\d{1,2})\s+dias?$/);
  if (inDays) return ymd(addCalendarDays(today, Number(inDays[1])));
  const weekday = WEEKDAYS.indexOf(text.replace(/^el\s+/, ""));
  if (weekday >= 0) return nextWeekday(today, weekday);
  const numeric = text.match(/(?:el\s+)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    const year = numeric[3] ? Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3]) : today.year;
    if (!mexicoWallToUtc(year, month, day, 0, 0)) return null;
    return `${year}-${pad(month)}-${pad(day)}`;
  }
  const named = text.match(/(?:el\s+)?(\d{1,2})\s+de\s+([a-z]+)(?:\s+de\s+(\d{4}))?/);
  if (named) {
    const month = MONTHS.indexOf(named[2]) + 1;
    const day = Number(named[1]);
    const year = named[3] ? Number(named[3]) : today.year;
    if (!month || !mexicoDayStartUtc(year, month, day)) return null;
    return `${year}-${pad(month)}-${pad(day)}`;
  }
  return null;
}

const DATE_PATTERN = "(?:hoy|manana|pasado manana|en\\s+\\d{1,2}\\s+dias?|el\\s+(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)|(?:el\\s+)?\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?|(?:el\\s+)?\\d{1,2}\\s+de\\s+[a-z]+(?:\\s+de\\s+\\d{4})?)";

export function parseInbound(raw: string, now = new Date()): InboundCommand | { type: "unknown" } {
  const original = raw.replace(/\s+/g, " ").trim();
  const text = plain(original);
  const command = text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  if (!command) return { type: "unknown" };
  if (/^(ayuda|help)$/.test(command)) return { type: "help" };
  if (/^(hoy|que hay hoy|pendientes de hoy)$/.test(command)) return { type: "list", range: "hoy" };
  if (/^(semana|esta semana|que hay( esta semana)?|pendientes)$/.test(command)) return { type: "list", range: "semana" };

  const kindMatch = text.match(/^([a-z]+)\s+(.+)$/);
  if (!kindMatch || !KIND_WORDS[kindMatch[1]]) return { type: "unknown" };
  const kind = KIND_WORDS[kindMatch[1]];
  let rest = kindMatch[2];
  let time: string | null = null;
  const timeMatch = rest.match(/(?:a\s+las\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (timeMatch && (rest.includes("a las") || timeMatch[2] || timeMatch[3])) {
    let hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2] ?? "0");
    if (timeMatch[3] === "pm" && hour < 12) hour += 12;
    if (timeMatch[3] === "am" && hour === 12) hour = 0;
    if (hour <= 23 && minute <= 59) {
      time = `${pad(hour)}:${pad(minute)}`;
      rest = rest.slice(0, timeMatch.index).trim();
    }
  }
  const dateMatch = rest.match(new RegExp(`(?:^|\\s)(${DATE_PATTERN})$`));
  const today = mexicoParts(now);
  let date: string | null = null;
  if (dateMatch?.[1]) date = parseDatePhrase(dateMatch[1], today);
  let title = original.replace(/^\S+\s+/, "").trim();
  if (time) title = title.replace(/\s*(?:a\s+las\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*$/i, "").trim();
  if (date) title = title.replace(/\s+(?:hoy|mañana|manana|pasado mañana|pasado manana|en\s+\d{1,2}\s+d[ií]as?|(?:el\s+)?(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)|(?:el\s+)?\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|(?:el\s+)?\d{1,2}\s+de\s+[a-záéíóúñ]+(?:\s+de\s+\d{4})?)\s*$/i, "").trim();
  title = title.replace(/\s+/g, " ").slice(0, 180);
  if (title.length < 2) return { type: "unknown" };
  return { type: "add", kind, title, date, time, allDay: Boolean(date) && !time };
}

export function helpMessage(): string {
  return [
    "Puedo anotar esto:",
    "hoy",
    "semana",
    "tarea Leer amparo mañana",
    "examen Civil el viernes 10:00",
    "clase Procesal hoy 19:00",
    "repaso Actos jurídicos en 2 días",
    "lectura El Federalista",
    "ayuda",
  ].join("\n");
}
