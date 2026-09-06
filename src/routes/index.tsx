import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BellRing,
  BookOpen,
  CalendarDays,
  Clock3,
  GraduationCap,
  Landmark,
  MapPin,
  ShoppingBasket,
  Camera,
  Sparkles,
} from "lucide-react";
import { Shell } from "@/components/shell";
import { Card, Pill, cn } from "@/components/ui";
import { useBoard } from "@/components/board-context";
import {
  formatLongDate,
  formatTodayLong,
  getMexicoCityClock,
  isSoon,
  slotBounds,
} from "@/lib/format";
import type { Course } from "@/lib/types";

export const Route = createFileRoute("/")({ component: Home });

type DayState = {
  current: Course | null;
  next: Course | null;
  status: "before" | "during" | "after" | "weekend";
  progress: number;
};

function getDayState(courses: Course[]): DayState {
  const clock = getMexicoCityClock();
  const ordered = [...courses].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  const weekday = clock.weekdayIndex >= 1 && clock.weekdayIndex <= 5;
  if (!weekday) return { current: null, next: ordered[0] ?? null, status: "weekend", progress: 0 };

  const first = ordered[0] ? slotBounds(ordered[0].timeSlot).start : null;
  const last = ordered.at(-1) ? slotBounds(ordered.at(-1)!.timeSlot).end : null;
  const current = ordered.find((course) => {
    const { start, end } = slotBounds(course.timeSlot);
    return start !== null && end !== null && clock.minutes >= start && clock.minutes < end;
  }) ?? null;
  const next = current ?? ordered.find((course) => {
    const { start } = slotBounds(course.timeSlot);
    return start !== null && clock.minutes < start;
  }) ?? null;

  if (first === null || last === null) return { current, next, status: "before", progress: 0 };
  if (clock.minutes < first) return { current: null, next: ordered[0] ?? null, status: "before", progress: 0 };
  if (clock.minutes >= last) return { current: null, next: ordered[0] ?? null, status: "after", progress: 100 };
  const progress = Math.max(0, Math.min(100, ((clock.minutes - first) / (last - first)) * 100));
  return { current, next, status: "during", progress };
}

function Home() {
  const board = useBoard();
  const upcoming = board.events.filter((event) => isSoon(event.eventDate, 16)).slice(0, 4);
  const pins = board.notices.filter((notice) => notice.pinned);
  const day = [...board.courses].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  const state = getDayState(day);
  const focusCourse = state.current ?? state.next;
  const clock = getMexicoCityClock();

  const stateLabel = state.current
    ? "Clase en curso"
    : state.status === "weekend"
      ? "Próxima jornada: lunes"
      : state.status === "after"
        ? "Jornada terminada"
        : "Próxima clase";

  return (
    <Shell
      eyebrow="Grupo 9114 · primer semestre"
      title="Tu jornada jurídica, de un vistazo."
      lead="Clases, avisos y actividades del grupo en una portada que cambia contigo durante el día."
    >
      <section className="relative overflow-hidden rounded-2xl border border-forest/15 bg-forest text-bg shadow-float">
        <div className="paper-grid absolute inset-0 opacity-20" />
        <div className="absolute -right-16 -top-20 size-72 rounded-full bg-clay/20 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 size-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[1.25fr_.75fr] lg:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-bg/85">
                <span className={cn("size-2 rounded-full", state.current ? "animate-pulse bg-clay-soft" : "bg-bg/65")} />
                {stateLabel}
              </span>
              <span className="text-xs text-bg/60">CDMX · {clock.timeLabel}</span>
            </div>
            <p className="mt-5 text-sm font-medium capitalize text-bg/65">{formatTodayLong()}</p>
            {focusCourse ? (
              <>
                <h2 className="mt-2 max-w-2xl font-display text-4xl leading-tight tracking-tight sm:text-5xl">
                  {focusCourse.name}
                </h2>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-bg/78">
                  <span className="inline-flex items-center gap-2"><Clock3 className="size-4" />{focusCourse.timeSlot}</span>
                  <span className="inline-flex items-center gap-2"><MapPin className="size-4" />{focusCourse.place}</span>
                  <span className="inline-flex items-center gap-2"><GraduationCap className="size-4" />{focusCourse.code}</span>
                </div>
                <p className="mt-3 text-sm text-bg/65">Docente: {focusCourse.chair}</p>
              </>
            ) : (
              <h2 className="mt-2 font-display text-4xl">Sin clases programadas.</h2>
            )}
            <div className="mt-7 max-w-2xl">
              <div className="mb-2 flex items-center justify-between text-xs text-bg/60">
                <span>07:00</span>
                <span>{Math.round(state.progress)}% de la jornada</span>
                <span>14:00</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/12">
                <div className="h-full rounded-full bg-clay-soft transition-[width] duration-700" style={{ width: `${state.progress}%` }} />
              </div>
            </div>
          </div>

          <div className="grid content-between gap-5 rounded-xl border border-white/12 bg-white/[0.08] p-5 backdrop-blur-sm">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-bg/55">
                <Sparkles className="size-3.5" />
                Pulso del grupo
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <Stat value={String(board.courses.length)} label="materias" />
                <Stat value={String(upcoming.length)} label="próximos" />
                <Stat value={String(pins.length)} label="avisos" />
              </div>
            </div>
            <Link
              to="/clases"
              className="inline-flex min-h-11 items-center justify-between rounded-lg bg-bg px-4 text-sm font-semibold text-forest transition-transform hover:-translate-y-0.5"
            >
              Ver jornada completa <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" interactive>
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">Horario de hoy</p>
              <h2 className="mt-1 font-display text-2xl">Jornada 07:00–14:00</h2>
            </div>
            <Link to="/clases" className="text-sm font-semibold text-forest">Detalle</Link>
          </div>
          <ol className="grid gap-1">
            {day.map((course) => {
              const active = state.current?.id === course.id;
              return (
                <li
                  key={course.id}
                  className={cn(
                    "grid grid-cols-[4.9rem_1fr_auto] items-center gap-3 rounded-md px-2 py-2.5 transition-colors",
                    active ? "bg-forest-soft" : "hover:bg-bg-warm/65",
                  )}
                >
                  <span className={cn("text-sm tabular-nums", active ? "font-semibold text-forest" : "text-ink-soft")}>{course.timeSlot.split("–")[0]}</span>
                  <span className="min-w-0 truncate font-medium">{course.name}</span>
                  <span className={cn("rounded-full px-2 py-1 text-xs", active ? "bg-forest text-bg" : "bg-bg-warm text-muted")}>{course.place}</span>
                </li>
              );
            })}
          </ol>
        </Card>

        <Card className="relative overflow-hidden" interactive>
          <div className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-clay/10 text-clay">
            <BellRing className="size-4" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">Importante</p>
          <h2 className="mt-1 pr-10 font-display text-2xl">Avisos fijos</h2>
          <ul className="mt-5 grid gap-4">
            {pins.map((notice, index) => (
              <li key={notice.id} className={cn(index ? "border-t border-line pt-4" : "")}>
                <p className="font-semibold">{notice.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{notice.body}</p>
              </li>
            ))}
          </ul>
          <Link to="/mural" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-forest">
            Abrir mural <ArrowRight className="size-4" />
          </Link>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card interactive>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">Calendario</p>
              <h2 className="mt-1 font-display text-2xl">Próximamente</h2>
            </div>
            <CalendarDays className="size-5 text-forest" />
          </div>
          <ul className="grid gap-3">
            {upcoming.map((event) => (
              <li key={event.id} className="grid grid-cols-[auto_1fr] gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                <div className="grid size-11 place-items-center rounded-lg bg-forest-soft text-center text-forest-deep">
                  <span className="text-xs font-bold tabular-nums">{event.eventDate.slice(8, 10)}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="forest">{event.kind}</Pill>
                    <span className="text-xs tabular-nums text-muted">{formatLongDate(event.eventDate)}</span>
                  </div>
                  <p className="mt-1 font-semibold">{event.title}</p>
                  <p className="text-sm text-muted">{event.timeSlot} · {event.place}</p>
                </div>
              </li>
            ))}
            {!upcoming.length ? <li className="text-sm text-muted">No hay actividades próximas registradas.</li> : null}
          </ul>
        </Card>

        <Card interactive>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">Acceso rápido</p>
              <h2 className="mt-1 font-display text-2xl">Herramientas del grupo</h2>
            </div>
            <Landmark className="size-5 text-forest" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <QuickLink to="/agenda" icon={CalendarDays} label="Agenda" hint="Talleres y fechas" />
            <QuickLink to="/biblioteca" icon={BookOpen} label="Biblioteca" hint="Libros del grupo" />
            <QuickLink to="/catedras" icon={Landmark} label="Cátedras" hint="Apuntes y tareas" />
            <QuickLink to="/bitacora" icon={Camera} label="Bitácora" hint="Fotos de clase" />
            <QuickLink to="/servicios" icon={ShoppingBasket} label="Servicios" hint="Comida y encargos" />
            <QuickLink to="/mesas" icon={GraduationCap} label="Mesas" hint="Estudio por materia" />
          </div>
        </Card>
      </div>
    </Shell>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-bg/55">{label}</p>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
  hint,
}: {
  to: "/agenda" | "/biblioteca" | "/mesas" | "/catedras" | "/bitacora" | "/servicios";
  icon: typeof CalendarDays;
  label: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-lg border border-line bg-bg-warm/60 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-forest/25 hover:bg-forest-soft"
    >
      <span className="grid size-9 place-items-center rounded-md bg-surface text-forest shadow-sm transition-transform group-hover:scale-105">
        <Icon className="size-4" />
      </span>
      <p className="mt-3 font-semibold">{label}</p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
    </Link>
  );
}
