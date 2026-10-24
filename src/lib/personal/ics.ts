import type { PersonalItem } from "./model.ts";
import { KIND_LABEL, anchorOf } from "./model.ts";
import { formatMexico } from "./dates.ts";

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function fold(line: string): string {
  const chunks: string[] = [];
  let rest = line;
  let width = 73;
  while (rest.length > width) {
    chunks.push(rest.slice(0, width));
    rest = rest.slice(width);
    width = 74;
  }
  chunks.push(rest);
  return chunks.join("\r\n ");
}

function utcStamp(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function dateStamp(iso: string): string {
  return utcStamp(iso).slice(0, 8);
}

function alarm(minutes: number): string {
  const days = Math.floor(minutes / 1440);
  const rest = minutes % 1440;
  const hours = Math.floor(rest / 60);
  const mins = rest % 60;
  const trigger = days && !hours && !mins ? `-P${days}D` : `-PT${days * 24 + hours}H${mins}M`.replace("PT0H", "PT");
  return ["BEGIN:VALARM", "ACTION:DISPLAY", fold(`DESCRIPTION:${icsEscape("Recordatorio")}`), `TRIGGER:${trigger}`, "END:VALARM"].join("\r\n");
}

export function buildIcs(items: PersonalItem[], now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//pnota.com//Espacio personal//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:pnota · espacio personal",
    "X-WR-TIMEZONE:America/Mexico_City",
  ];
  for (const item of items) {
    if (item.status === "archivado") continue;
    const start = anchorOf(item);
    if (!start) continue;
    const end = item.endsAt && new Date(item.endsAt) > new Date(start) ? item.endsAt : new Date(new Date(start).getTime() + (item.allDay ? 86_400_000 : 3_600_000)).toISOString();
    const summary = `${KIND_LABEL[item.kind]}: ${item.title}`;
    const description = [item.subject, item.notes, item.url].filter(Boolean).join("\n");
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${item.id}@pnota.com`);
    lines.push(`DTSTAMP:${utcStamp(now.toISOString())}`);
    if (item.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${dateStamp(start)}`);
      lines.push(`DTEND;VALUE=DATE:${dateStamp(end)}`);
    } else {
      lines.push(`DTSTART:${utcStamp(start)}`);
      lines.push(`DTEND:${utcStamp(end)}`);
    }
    lines.push(fold(`SUMMARY:${icsEscape(summary)}`));
    if (description) lines.push(fold(`DESCRIPTION:${icsEscape(description)}`));
    if (item.location) lines.push(fold(`LOCATION:${icsEscape(item.location)}`));
    if (item.url) lines.push(fold(`URL:${icsEscape(item.url)}`));
    lines.push(`CATEGORIES:${icsEscape(KIND_LABEL[item.kind])}`);
    lines.push(`STATUS:${item.status === "hecho" ? "COMPLETED" : "CONFIRMED"}`);
    for (const minutes of item.reminderMinutes) lines.push(alarm(minutes));
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

export function googleCalendarLink(item: PersonalItem): string | null {
  const start = anchorOf(item);
  if (!start) return null;
  const end = item.endsAt && new Date(item.endsAt) > new Date(start) ? item.endsAt : new Date(new Date(start).getTime() + (item.allDay ? 86_400_000 : 3_600_000)).toISOString();
  const dates = item.allDay ? `${dateStamp(start)}/${dateStamp(end)}` : `${utcStamp(start)}/${utcStamp(end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${KIND_LABEL[item.kind]}: ${item.title}`,
    dates,
    details: [item.subject, item.notes].filter(Boolean).join("\n").slice(0, 800),
    location: item.location,
  });
  if (item.url) params.set("location", item.location || item.url);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function calendarDescription(item: PersonalItem): string {
  const when = formatMexico(anchorOf(item), item.allDay);
  return `${KIND_LABEL[item.kind]} · ${item.title} · ${when}`;
}
