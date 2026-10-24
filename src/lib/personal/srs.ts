/** SM-2, the same family Anki uses, reduced to four buttons. */

export type ReviewGrade = "otra" | "dificil" | "bien" | "facil";

export type SrsState = {
  ease: number;
  intervalDays: number;
  repetitions: number;
};

const QUALITY: Record<ReviewGrade, number> = { otra: 1, dificil: 3, bien: 4, facil: 5 };

export function applyReview(state: SrsState, grade: ReviewGrade): SrsState {
  const quality = QUALITY[grade];
  let ease = state.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;
  if (quality < 3) return { ease, intervalDays: 1, repetitions: 0 };
  const repetitions = state.repetitions + 1;
  let intervalDays = 1;
  if (repetitions === 1) intervalDays = grade === "facil" ? 3 : 1;
  else if (repetitions === 2) intervalDays = grade === "facil" ? 7 : grade === "dificil" ? 3 : 6;
  else intervalDays = Math.max(1, Math.round(state.intervalDays * (grade === "dificil" ? Math.max(1.2, ease - 0.15) : ease)));
  return { ease: Math.round(ease * 100) / 100, intervalDays, repetitions };
}

export function initialSrs(): SrsState {
  return { ease: 2.5, intervalDays: 0, repetitions: 0 };
}

export function intervalLabel(days: number): string {
  if (days <= 0) return "hoy";
  if (days === 1) return "mañana";
  if (days < 7) return `en ${days} días`;
  if (days === 7) return "en una semana";
  if (days < 30) return `en ${Math.round(days / 7)} semanas`;
  if (days < 60) return "en un mes";
  return `en ${Math.round(days / 30)} meses`;
}
