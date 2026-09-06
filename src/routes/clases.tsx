import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Building2, Clock3, MapPin } from "lucide-react";
import { Shell } from "@/components/shell";
import { useBoard } from "@/components/board-context";
import { useAreaVisit } from "@/components/directory";
import { Card, Pill, cn } from "@/components/ui";
import { getMexicoCityClock, slotBounds } from "@/lib/format";

export const Route = createFileRoute("/clases")({ component: ClasesPage });

function ClasesPage() {
  const { courses } = useBoard();
  useAreaVisit("clases");
  const ordered = [...courses].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  const clock = getMexicoCityClock();
  const isWeekday = clock.weekdayIndex >= 1 && clock.weekdayIndex <= 5;
  const currentId = isWeekday
    ? ordered.find((course) => {
        const { start, end } = slotBounds(course.timeSlot);
        return start !== null && end !== null && clock.minutes >= start && clock.minutes < end;
      })?.id
    : undefined;
  const firstStart = ordered[0] ? slotBounds(ordered[0].timeSlot).start : null;
  const lastEnd = ordered.at(-1) ? slotBounds(ordered.at(-1)!.timeSlot).end : null;
  const progress = isWeekday && firstStart !== null && lastEnd !== null
    ? Math.max(0, Math.min(100, ((clock.minutes - firstStart) / (lastEnd - firstStart)) * 100))
    : 0;

  return (
    <Shell
      eyebrow="Horario · Grupo 9114"
      title="Siete materias. Una jornada continua."
      lead="Consulta el bloque completo y ubica rápidamente en qué punto del día estás y cuándo cambia el salón."
    >
      <Card className="mb-6 overflow-hidden bg-forest text-bg" interactive>
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Grupo 9114</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Lunes a viernes</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Presencial</span>
            </div>
            <h2 className="mt-5 font-display text-3xl">Bloque académico 07:00–14:00</h2>
            <p className="mt-2 max-w-xl text-sm text-bg/70">Seis materias en D-106 y el cierre de jornada en E-003.</p>
            <div className="mt-5 max-w-2xl">
              <div className="mb-2 flex justify-between text-xs text-bg/55"><span>07:00</span><span>{Math.round(progress)}%</span><span>14:00</span></div>
              <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-clay-soft transition-[width] duration-700" style={{ width: `${progress}%` }} /></div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.12em] text-bg/50">Hora CDMX</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{clock.timeLabel}</p>
          </div>
        </div>
      </Card>

      <ol className="relative grid gap-3 before:absolute before:bottom-8 before:left-[1.45rem] before:top-8 before:w-px before:bg-line sm:before:left-[5.9rem]">
        {ordered.map((course, index) => {
          const active = currentId === course.id;
          const changeBuilding = index === ordered.length - 1;
          return (
            <li key={course.id} className="relative pl-12 sm:pl-0">
              <span className={cn(
                "absolute left-[1.05rem] top-7 z-10 size-3 rounded-full border-2 border-bg sm:left-[5.55rem]",
                active ? "animate-pulse bg-clay" : "bg-line-strong",
              )} />
              <Card
                interactive
                className={cn(
                  "grid gap-4 transition-colors sm:grid-cols-[5rem_1fr_auto] sm:items-center",
                  active && "border-forest/30 bg-forest-soft",
                )}
              >
                <div className="hidden sm:block">
                  <p className={cn("font-display text-2xl tabular-nums leading-none", active ? "text-forest-deep" : "text-forest")}>{course.timeSlot.split("–")[0]}</p>
                  <p className="mt-1 text-xs tabular-nums text-muted">a {course.timeSlot.split("–")[1]}</p>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={active ? "forest" : "neutral"}>{course.code}</Pill>
                    {active ? <Pill tone="clay">Ahora</Pill> : null}
                    {changeBuilding ? <Pill tone="clay">Cambio de edificio</Pill> : null}
                  </div>
                  <h2 className="mt-2 font-display text-2xl leading-tight">{course.name}</h2>
                  <p className="mt-1 text-sm text-muted">{course.chair}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted sm:hidden">
                    <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{course.timeSlot}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{course.place}</span>
                  </div>
                </div>
                <div className="hidden min-w-24 text-right sm:block">
                  <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold", active ? "bg-forest text-bg" : "bg-bg-warm text-ink-soft")}>
                    {changeBuilding ? <Building2 className="size-3.5" /> : <MapPin className="size-3.5" />}
                    {course.place}
                  </span>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 rounded-xl border border-clay/15 bg-clay/10 p-4 text-sm text-ink-soft">
        <p className="flex items-center gap-2 font-semibold text-clay"><Building2 className="size-4" />Cambio de edificio</p>
        <p className="mt-1">Al terminar Introducción a la teoría del derecho, el grupo pasa de D-106 a E-003 para la última materia.</p>
        <span className="mt-2 inline-flex items-center gap-1 font-semibold text-forest">12:50 recomendado <ArrowRight className="size-3.5" /></span>
      </div>
    </Shell>
  );
}
