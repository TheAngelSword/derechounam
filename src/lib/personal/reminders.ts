import { anchorOf, KIND_LABEL, reminderLabel, type PersonalItem } from "./model.ts";
import { formatMexico } from "./dates.ts";

export type DueReminder = {
  itemId: string;
  ownerUserId: string;
  offsetMinutes: number;
  anchorIso: string;
  dedupKey: string;
  body: string;
};

// A one-day reminder can still leave on the next morning run. Hobby cron is
// daily and may slip by almost an hour, so long offsets tolerate 26 hours.
// A 15-minute reminder never waits longer than its own offset.
const MAX_LATE_MINUTES = 26 * 60;

export function pendingReminders(
  items: Array<PersonalItem & { ownerUserId: string }>,
  sent: Set<string>,
  now = new Date(),
): DueReminder[] {
  const due: DueReminder[] = [];
  for (const item of items) {
    if (item.status !== "pendiente") continue;
    const anchorIso = anchorOf(item);
    if (!anchorIso) continue;
    const anchor = new Date(anchorIso).getTime();
    if (!Number.isFinite(anchor) || anchor <= now.getTime()) continue;
    for (const offsetMinutes of item.reminderMinutes) {
      const fireAt = anchor - offsetMinutes * 60_000;
      const lateLimit = Math.min(offsetMinutes, MAX_LATE_MINUTES) * 60_000;
      if (now.getTime() < fireAt || now.getTime() - fireAt > lateLimit) continue;
      const dedupKey = `${item.id}:${offsetMinutes}:${anchorIso}`;
      if (sent.has(dedupKey)) continue;
      const when = formatMexico(anchorIso, item.allDay);
      const subject = item.subject ? `\n${item.subject}` : "";
      due.push({
        itemId: item.id,
        ownerUserId: item.ownerUserId,
        offsetMinutes,
        anchorIso,
        dedupKey,
        body: `Recordatorio (${reminderLabel(offsetMinutes)})\n${KIND_LABEL[item.kind]} · ${item.title}${subject}\n${when}\npnota`,
      });
    }
  }
  return due;
}
