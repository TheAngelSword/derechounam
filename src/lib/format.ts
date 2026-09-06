const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MX_TZ = "America/Mexico_City";

function mexicoParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: MX_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: parts.weekday ?? "",
  };
}

export function getTodayIso(date = new Date()) {
  const parts = mexicoParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function getMexicoCityClock(date = new Date()) {
  const parts = mexicoParts(date);
  const weekdayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(parts.weekday);
  return {
    ...parts,
    weekdayIndex: weekdayIndex < 0 ? 0 : weekdayIndex,
    minutes: parts.hour * 60 + parts.minute,
    timeLabel: `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`,
    iso: getTodayIso(date),
  };
}

export function formatTodayLong(date = new Date()) {
  const parts = mexicoParts(date);
  const weekdayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(parts.weekday);
  const month = new Intl.DateTimeFormat("es-MX", { timeZone: MX_TZ, month: "long" }).format(date);
  return `${WEEKDAYS[weekdayIndex < 0 ? 0 : weekdayIndex]} ${parts.day} de ${month}`;
}

export function formatLongDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = WEEKDAYS[date.getUTCDay()];
  return `${weekday} ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

export function isSoon(iso: string, days = 10) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return false;
  const [todayYear, todayMonth, todayDay] = getTodayIso().split("-").map(Number);
  const event = Date.UTC(year, month - 1, day);
  const today = Date.UTC(todayYear, todayMonth - 1, todayDay);
  const diff = (event - today) / 86400000;
  return diff >= 0 && diff <= days;
}

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.trim().split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

export function slotBounds(slot: string) {
  const [startText, endText] = slot.split("–");
  const start = startText ? timeToMinutes(startText) : null;
  const end = endText ? timeToMinutes(endText) : null;
  return { start, end };
}
