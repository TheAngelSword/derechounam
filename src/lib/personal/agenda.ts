import { endOfMexicoWeek, formatMexico, startOfMexicoDay } from "./dates.ts";
import { KIND_LABEL, anchorOf, type PersonalItem } from "./model.ts";

export function agendaText(items: PersonalItem[], range: "hoy" | "semana", now = new Date()): string {
  const start = startOfMexicoDay(now).getTime();
  const end = range === "hoy" ? start + 86_400_000 : endOfMexicoWeek(now).getTime();
  const rows = items.filter((item) => item.status === "pendiente").filter((item) => {
    const anchor = anchorOf(item);
    if (!anchor) return false;
    const time = new Date(anchor).getTime();
    return time >= start && time < end;
  });
  rows.sort((a, b) => (anchorOf(a) ?? "").localeCompare(anchorOf(b) ?? ""));
  if (!rows.length) return range === "hoy" ? "Hoy no tienes nada fechado." : "Esta semana no tienes nada fechado.";
  const lines = rows.slice(0, 15).map((item) => `• ${KIND_LABEL[item.kind]}: ${item.title} (${formatMexico(anchorOf(item), item.allDay)})`);
  const extra = rows.length > 15 ? `\n…y ${rows.length - 15} más en pnota.` : "";
  return `${range === "hoy" ? "Hoy" : "Esta semana"}:\n${lines.join("\n")}${extra}`;
}
