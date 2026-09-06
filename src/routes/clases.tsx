import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Building2, CalendarRange, Clock3, MapPin, School, UserRound } from "lucide-react";
import { Shell } from "@/components/shell";
import { useBoard } from "@/components/board-context";
import { useAreaVisit } from "@/components/directory";
import { Card, Pill, cn } from "@/components/ui";
import { getMexicoCityClock, slotBounds } from "@/lib/format";

export const Route = createFileRoute("/clases")({ component: ClasesPage });

const SCHEDULE_DETAILS = [
  { degree: "Mtra.", lastName: "Trigueros Olivares", firstName: "Roxana", code: "1122", group: "9114", subject: "Derecho romano I (Primer ingreso)", start: "07:00", end: "08:00", room: "D-106" },
  { degree: "Lic.", lastName: "Belmont Martínez", firstName: "Arturo", code: "1121", group: "9114", subject: "Acto jurídico y derecho de las personas (Primer ingreso)", start: "08:00", end: "09:00", room: "D-106" },
  { degree: "Lic.", lastName: "Barco Martínez", firstName: "Dionisio Eduardo", code: "1123", group: "9114", subject: "Historia del derecho mexicano (Primer ingreso)", start: "09:00", end: "10:00", room: "D-106" },
  { degree: "Dr.", lastName: "Cruz Vázquez", firstName: "Marcial Manuel", code: "1127", group: "9114", subject: "Teoría general del estado (Primer ingreso)", start: "10:00", end: "11:00", room: "D-106" },
  { degree: "Mtra.", lastName: "GONZÁLEZ NAHLE", firstName: "MARIA FERNANDA", code: "1126", group: "9114", subject: "Sociología jurídica (Primer ingreso)", start: "11:00", end: "12:00", room: "D-106" },
  { degree: "Mtra.", lastName: "Urbina Anguas", firstName: "Lizzet", code: "1124", group: "9114", subject: "Introducción a la teoría del derecho (Primer ingreso)", start: "12:00", end: "13:00", room: "D-106" },
  { degree: "Lic.", lastName: "Ramírez Figueroa", firstName: "Apolinar Medardo", code: "1125", group: "9114", subject: "Ser universitario y cultura de la legalidad (Primer ingreso)", start: "13:00", end: "14:00", room: "E-003" },
] as const;

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
      eyebrow="Horarios · Grupo 9114"
      title="Horario completo del grupo 9114."
      lead="La jornada corre de 07:00 a 14:00. Aquí está el bloque académico con docentes, claves, salones y una vista tipo tabla como la que compartiste."
    >
      <Card className="unam-hero-card hero-glow animated-orb mb-6 overflow-hidden" interactive>
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Grupo 9114</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Lunes a viernes</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Primer ingreso</span>
            </div>
            <h2 className="mt-5 font-display text-3xl">Bloque académico 07:00–14:00</h2>
            <p className="mt-2 max-w-2xl text-sm text-bg/75">Seis materias se imparten en D-106 y la última cambia a E-003. También dejé una vista administrativa con grado, apellidos, nombre, clave, grupo, asignatura, inicio, fin y salón.</p>
            <div className="mt-5 max-w-2xl">
              <div className="mb-2 flex justify-between text-xs text-bg/55"><span>07:00</span><span>{Math.round(progress)}%</span><span>14:00</span></div>
              <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-clay-soft transition-[width] duration-700" style={{ width: `${progress}%` }} /></div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-right shadow-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-bg/50">Hora CDMX</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{clock.timeLabel}</p>
          </div>
        </div>
      </Card>

      <div className="stagger-children mb-6 grid gap-4 md:grid-cols-3">
        <Card interactive className="soft-raise">
          <div className="flex items-center gap-2 text-sm font-semibold text-forest"><School className="size-4" /> Materias</div>
          <p className="mt-2 font-display text-3xl">7</p>
          <p className="mt-2 text-sm text-muted">Un bloque continuo para el primer semestre del grupo 9114.</p>
        </Card>
        <Card interactive className="soft-raise">
          <div className="flex items-center gap-2 text-sm font-semibold text-forest"><CalendarRange className="size-4" /> Jornada</div>
          <p className="mt-2 font-display text-3xl">7 horas</p>
          <p className="mt-2 text-sm text-muted">De lunes a viernes, de 07:00 a 14:00, sin huecos entre clases.</p>
        </Card>
        <Card interactive className="soft-raise">
          <div className="flex items-center gap-2 text-sm font-semibold text-forest"><Building2 className="size-4" /> Salones</div>
          <p className="mt-2 font-display text-3xl">D-106 / E-003</p>
          <p className="mt-2 text-sm text-muted">Se cambia a E-003 al terminar Introducción a la teoría del derecho.</p>
        </Card>
      </div>

      <ol className="relative grid gap-3 before:absolute before:bottom-8 before:left-[1.45rem] before:top-8 before:w-px before:bg-line sm:before:left-[5.9rem]">
        {ordered.map((course, index) => {
          const active = currentId === course.id;
          const changeBuilding = index === ordered.length - 1;
          return (
            <li key={course.id} className="relative pl-12 sm:pl-0">
              <span
                className={cn(
                  "absolute left-[1.05rem] top-7 z-10 size-3 rounded-full border-2 border-bg sm:left-[5.55rem]",
                  active ? "animate-pulse bg-clay" : "bg-line-strong",
                )}
              />
              <Card
                interactive
                className={cn(
                  "soft-raise grid gap-4 transition-colors sm:grid-cols-[5rem_1fr_auto] sm:items-center",
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
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted"><UserRound className="size-3.5" />Docente: {course.chair}</p>
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

      <Card className="mt-8 overflow-hidden" interactive>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">Vista administrativa</p>
            <h2 className="mt-1 font-display text-3xl">Tabla completa del horario</h2>
          </div>
          <Pill tone="forest">Basada en la tabla proporcionada</Pill>
        </div>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="min-w-[980px] w-full border-collapse text-sm">
            <thead className="bg-forest text-left text-bg">
              <tr>
                <th className="px-4 py-3 font-semibold">Grado</th>
                <th className="px-4 py-3 font-semibold">Apellidos</th>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Clave</th>
                <th className="px-4 py-3 font-semibold">Grupo</th>
                <th className="px-4 py-3 font-semibold">Asignatura</th>
                <th className="px-4 py-3 font-semibold">Inicio</th>
                <th className="px-4 py-3 font-semibold">Fin</th>
                <th className="px-4 py-3 font-semibold">Salón</th>
              </tr>
            </thead>
            <tbody>
              {SCHEDULE_DETAILS.map((row, index) => (
                <tr key={`${row.code}-${row.start}`} className={cn(index % 2 === 0 ? "bg-white" : "bg-bg-warm/55", "border-t border-line") }>
                  <td className="px-4 py-3 font-medium text-ink-soft">{row.degree}</td>
                  <td className="px-4 py-3 font-medium text-ink">{row.lastName}</td>
                  <td className="px-4 py-3">{row.firstName}</td>
                  <td className="px-4 py-3 font-semibold text-forest">{row.code}</td>
                  <td className="px-4 py-3">{row.group}</td>
                  <td className="px-4 py-3">{row.subject}</td>
                  <td className="px-4 py-3 tabular-nums">{row.start}</td>
                  <td className="px-4 py-3 tabular-nums">{row.end}</td>
                  <td className="px-4 py-3">{row.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}
