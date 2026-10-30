/** Calendar math in America/Mexico_City. Mexico no longer observes daylight saving. */

export type MexicoParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

const WEEKDAY: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function mexicoParts(now = new Date()): MexicoParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });
  const bag: Record<string, string> = {};
  for (const part of fmt.formatToParts(now)) {
    if (part.type !== "literal") bag[part.type] = part.value;
  }
  let hour = Number(bag.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour,
    minute: Number(bag.minute),
    weekday: WEEKDAY[bag.weekday] ?? 0,
  };
}

export function addCalendarDays(parts: Pick<MexicoParts, "year" | "month" | "day">, days: number) {
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

/** Interpret a wall-clock time in Mexico City and return a UTC ISO string. */
export function mexicoWallToUtc(year: number, month: number, day: number, hour: number, minute: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  const guess = new Date(Date.UTC(year, month - 1, day, hour + 6, minute));
  const got = mexicoParts(guess);
  const wantUtc = Date.UTC(year, month - 1, day, hour, minute);
  const gotUtc = Date.UTC(got.year, got.month - 1, got.day, got.hour, got.minute);
  const fixed = new Date(guess.getTime() + (wantUtc - gotUtc));
  const check = mexicoParts(fixed);
  if (check.year !== year || check.month !== month || check.day !== day || check.hour !== hour || check.minute !== minute) return null;
  return fixed.toISOString();
}

export function mexicoDayStartUtc(year: number, month: number, day: number): string | null {
  return mexicoWallToUtc(year, month, day, 0, 0);
}

export function startOfMexicoDay(now = new Date()): Date {
  const p = mexicoParts(now);
  return new Date(mexicoDayStartUtc(p.year, p.month, p.day) ?? now.toISOString());
}

export function endOfMexicoWeek(now = new Date()): Date {
  const p = mexicoParts(now);
  const daysUntilNextMonday = ((8 - p.weekday) % 7) || 7;
  const next = addCalendarDays(p, daysUntilNextMonday);
  return new Date(mexicoDayStartUtc(next.year, next.month, next.day) ?? now.toISOString());
}

export function formatMexico(iso: string | null, allDay = false): string {
  if (!iso) return "Sin fecha";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(allDay ? {} : { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
  }).format(date);
}

export function mexicoDateInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const p = mexicoParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function mexicoTimeInput(iso: string | null, allDay: boolean): string {
  if (!iso || allDay) return "";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const p = mexicoParts(date);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

export function combineMexico(date: string | null, time: string | null, allDay: boolean): { start: string | null; end: string | null; allDay: boolean } {
  if (!date || !DATE_RE.test(date)) return { start: null, end: null, allDay: false };
  const [, y, m, d] = date.match(DATE_RE) ?? [];
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (allDay || !time) {
    const start = mexicoDayStartUtc(year, month, day);
    const next = addCalendarDays({ year, month, day }, 1);
    const end = mexicoDayStartUtc(next.year, next.month, next.day);
    return { start, end, allDay: true };
  }
  if (!TIME_RE.test(time)) return { start: null, end: null, allDay: false };
  const [, hh, mm] = time.match(TIME_RE) ?? [];
  const start = mexicoWallToUtc(year, month, day, Number(hh), Number(mm));
  return { start, end: start ? new Date(new Date(start).getTime() + 60 * 60_000).toISOString() : null, allDay: false };
}

export function publicHttpsUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("El enlace no es válido.");
  }
  if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) {
    throw new Error("Usa un enlace http o https, sin usuario ni contraseña.");
  }
  return url.href.slice(0, 500);
}
