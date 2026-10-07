import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CalendarRange,
  Clock3,
  Mail,
  MapPin,
  Pencil,
  Phone,
  School,
  UserRound,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useRefreshBoard } from "@/components/board-context";
import { useAreaVisit, useDirectory } from "@/components/directory";
import { Button, Card, Field, Input, Pill, Select, cn } from "@/components/ui";
import { updateCourse } from "@/lib/content";
import { getMexicoCityClock, slotBounds } from "@/lib/format";
import type { Course } from "@/lib/types";

export const Route = createFileRoute("/clases")({ component: ClasesPage });

function normalizeTimeSlot(value: string) {
  return value.trim().replace(/\s*(?:-|–|—)\s*/, "–");
}

function durationLabel(minutes: number | null) {
  if (minutes === null || minutes <= 0) return "—";
  if (minutes % 60 === 0) return `${minutes / 60} ${minutes === 60 ? "hora" : "horas"}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} h ${rest} min` : `${rest} min`;
}

function ClasesPage() {
  const { courses } = useBoard();
  const refresh = useRefreshBoard();
  const { user, directory } = useDirectory();
  useAreaVisit("clases");

  const [editing, setEditing] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
  const totalMinutes = firstStart !== null && lastEnd !== null && lastEnd > firstStart ? lastEnd - firstStart : null;
  const progress = isWeekday && firstStart !== null && lastEnd !== null && lastEnd > firstStart
    ? Math.max(0, Math.min(100, ((clock.minutes - firstStart) / (lastEnd - firstStart)) * 100))
    : 0;
  const rooms = Array.from(new Set(ordered.map((course) => course.place).filter(Boolean)));
  const firstLabel = ordered[0]?.timeSlot.split("–")[0] || "—";
  const lastLabel = ordered.at(-1)?.timeSlot.split("–")[1] || "—";

  function canManageCourse(course: Course) {
    const me = directory?.me;
    if (!user || !me || me.status !== "activo") return false;
    return me.role === "moderador"
      || course.createdBy === user.id
      || directory?.mods.some((item) => item.userId === user.id && item.area === "clases") === true;
  }

  function startEditing(course: Course, scroll = false) {
    setEditing(course);
    setError(null);
    setSuccess(null);
    if (scroll && typeof document !== "undefined") {
      window.setTimeout(() => document.getElementById(`horario-${course.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    }
  }

  async function onEdit(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    setSuccess(null);
    try {
      await updateCourse({
        data: {
          id,
          code: String(data.get("code") ?? ""),
          name: String(data.get("name") ?? ""),
          chair: String(data.get("chair") ?? ""),
          modality: String(data.get("modality") ?? "Presencial") as "Presencial" | "En línea" | "Híbrido",
          weekday: String(data.get("weekday") ?? "Lunes a viernes"),
          timeSlot: normalizeTimeSlot(String(data.get("timeSlot") ?? "")),
          place: String(data.get("place") ?? ""),
          semester: String(data.get("semester") ?? "Primer semestre"),
          group: String(data.get("group") ?? "9114"),
          professorPhone: String(data.get("professorPhone") ?? ""),
          professorEmail: String(data.get("professorEmail") ?? ""),
        },
      });
      await refresh();
      setEditing(null);
      setSuccess("Horario y ficha del docente actualizados.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar el horario.");
    }
  }

  return (
    <Shell
      eyebrow="Horarios · Grupo 9114"
      title="Horario completo del grupo 9114."
      lead="Consulta y administra el bloque académico con materias, docentes, claves, salones y fichas de contacto de cada profesor."
    >
      <Card className="unam-hero-card hero-glow animated-orb mb-6 overflow-hidden" interactive>
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Grupo 9114</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Lunes a viernes</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Horario editable</span>
            </div>
            <h2 className="mt-5 font-display text-3xl">Bloque académico {firstLabel}–{lastLabel}</h2>
            <p className="mt-2 max-w-2xl text-sm text-bg/75">
              Los cambios de materia, profesor, horario, salón y datos de contacto se reflejan en toda esta página desde una sola ficha.
            </p>
            <div className="mt-5 max-w-2xl">
              <div className="mb-2 flex justify-between text-xs text-bg/55"><span>{firstLabel}</span><span>{Math.round(progress)}%</span><span>{lastLabel}</span></div>
              <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-clay-soft transition-[width] duration-700" style={{ width: `${progress}%` }} /></div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-right shadow-sm">
            <p className="text-xs uppercase tracking-[0.12em] text-bg/50">Hora CDMX</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{clock.timeLabel}</p>
          </div>
        </div>
      </Card>

      {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">{error}</p> : null}
      {success ? <p className="mb-4 rounded-lg border border-forest/15 bg-forest-soft px-4 py-3 text-sm font-medium text-forest-deep">{success}</p> : null}

      <div className="stagger-children mb-6 grid gap-4 md:grid-cols-3">
        <Card interactive className="soft-raise">
          <div className="flex items-center gap-2 text-sm font-semibold text-forest"><School className="size-4" /> Materias</div>
          <p className="mt-2 font-display text-3xl">{ordered.length}</p>
          <p className="mt-2 text-sm text-muted">Materias activas actualmente en el horario del grupo.</p>
        </Card>
        <Card interactive className="soft-raise">
          <div className="flex items-center gap-2 text-sm font-semibold text-forest"><CalendarRange className="size-4" /> Jornada</div>
          <p className="mt-2 font-display text-3xl">{durationLabel(totalMinutes)}</p>
          <p className="mt-2 text-sm text-muted">De {firstLabel} a {lastLabel}, según el horario actualmente registrado.</p>
        </Card>
        <Card interactive className="soft-raise">
          <div className="flex items-center gap-2 text-sm font-semibold text-forest"><Building2 className="size-4" /> Salones</div>
          <p className="mt-2 font-display text-3xl">{rooms.length ? rooms.join(" / ") : "—"}</p>
          <p className="mt-2 text-sm text-muted">Los salones se actualizan automáticamente al editar una materia.</p>
        </Card>
      </div>

      <ol className="relative grid gap-3 before:absolute before:bottom-8 before:left-[1.45rem] before:top-8 before:w-px before:bg-line sm:before:left-[5.9rem]">
        {ordered.map((course, index) => {
          const active = currentId === course.id;
          const changeBuilding = index > 0 && ordered[index - 1]?.place !== course.place;
          const editable = canManageCourse(course);
          const isEditing = editing?.id === course.id;
          const [start = "", end = ""] = course.timeSlot.split("–");
          return (
            <li id={`horario-${course.id}`} key={course.id} className="relative pl-12 sm:pl-0">
              <span
                className={cn(
                  "absolute left-[1.05rem] top-7 z-10 size-3 rounded-full border-2 border-bg sm:left-[5.55rem]",
                  active ? "animate-pulse bg-clay" : "bg-line-strong",
                )}
              />
              <Card interactive className={cn("soft-raise transition-colors", active && "border-forest/30 bg-forest-soft") }>
                <div className="grid gap-4 sm:grid-cols-[5rem_1fr_auto] sm:items-center">
                  <div className="hidden sm:block">
                    <p className={cn("font-display text-2xl tabular-nums leading-none", active ? "text-forest-deep" : "text-forest")}>{start}</p>
                    <p className="mt-1 text-xs tabular-nums text-muted">a {end}</p>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={active ? "forest" : "neutral"}>{course.code}</Pill>
                      {active ? <Pill tone="clay">Ahora</Pill> : null}
                      {changeBuilding ? <Pill tone="clay">Cambio de salón</Pill> : null}
                    </div>
                    <h2 className="mt-2 font-display text-2xl leading-tight">{course.name}</h2>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted"><UserRound className="size-3.5" />Docente: {course.chair}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
                      {course.professorPhone ? <a className="inline-flex items-center gap-1.5 hover:text-forest" href={`tel:${course.professorPhone.replace(/[^\d+]/g, "")}`}><Phone className="size-3.5" />{course.professorPhone}</a> : null}
                      {course.professorEmail ? <a className="inline-flex items-center gap-1.5 hover:text-forest" href={`mailto:${course.professorEmail}`}><Mail className="size-3.5" />{course.professorEmail}</a> : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted sm:hidden">
                      <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{course.timeSlot}</span>
                      <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{course.place}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:min-w-28 sm:justify-end">
                    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold", active ? "bg-forest text-bg" : "bg-bg-warm text-ink-soft")}>
                      {changeBuilding ? <Building2 className="size-3.5" /> : <MapPin className="size-3.5" />}
                      {course.place}
                    </span>
                    {editable ? (
                      <button type="button" onClick={() => isEditing ? setEditing(null) : startEditing(course)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-xs font-semibold text-forest transition hover:border-forest/30">
                        {isEditing ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}
                        {isEditing ? "Cerrar" : "Editar"}
                      </button>
                    ) : null}
                  </div>
                </div>

                {isEditing ? (
                  <form onSubmit={(event) => onEdit(event, course.id)} className="mt-5 grid gap-4 border-t border-line pt-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <p className="font-display text-xl">Editar horario y ficha del profesor</p>
                      <p className="mt-1 text-sm text-muted">Los cambios se aplican inmediatamente al horario y al directorio docente.</p>
                    </div>
                    <Field label="Clave"><Input name="code" required defaultValue={course.code} /></Field>
                    <Field label="Materia"><Input name="name" required defaultValue={course.name} /></Field>
                    <Field label="Profesor"><Input name="chair" required defaultValue={course.chair} /></Field>
                    <Field label="Horario" hint="Ej. 07:00–08:00"><Input name="timeSlot" required defaultValue={course.timeSlot} /></Field>
                    <Field label="Salón"><Input name="place" required defaultValue={course.place} /></Field>
                    <Field label="Días"><Input name="weekday" required defaultValue={course.weekday} /></Field>
                    <Field label="Teléfono del profesor" hint="Opcional"><Input name="professorPhone" type="tel" defaultValue={course.professorPhone || ""} placeholder="55 1234 5678" /></Field>
                    <Field label="Correo electrónico" hint="Opcional"><Input name="professorEmail" type="email" defaultValue={course.professorEmail || ""} placeholder="profesor@derecho.unam.mx" /></Field>
                    <Field label="Grupo"><Input name="group" required defaultValue={course.group} /></Field>
                    <Field label="Semestre"><Input name="semester" required defaultValue={course.semester} /></Field>
                    <Field label="Modalidad">
                      <Select name="modality" defaultValue={course.modality}>
                        <option>Presencial</option><option>En línea</option><option>Híbrido</option>
                      </Select>
                    </Field>
                    <div className="flex items-end gap-2">
                      <Button type="submit"><Pencil className="mr-2 size-4" />Guardar cambios</Button>
                      <Button type="button" variant="line" onClick={() => setEditing(null)}>Cancelar</Button>
                    </div>
                  </form>
                ) : null}
              </Card>
            </li>
          );
        })}
      </ol>

      {ordered.some((course, index) => index > 0 && ordered[index - 1]?.place !== course.place) ? (
        <div className="mt-6 rounded-xl border border-clay/15 bg-clay/10 p-4 text-sm text-ink-soft">
          <p className="flex items-center gap-2 font-semibold text-clay"><Building2 className="size-4" />Cambios de salón</p>
          <p className="mt-1">El horario marca automáticamente cuándo la siguiente materia cambia de salón.</p>
          <span className="mt-2 inline-flex items-center gap-1 font-semibold text-forest">Revisa el salón antes de cada bloque <ArrowRight className="size-3.5" /></span>
        </div>
      ) : null}

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">Directorio docente</p>
            <h2 className="mt-1 font-display text-3xl">Ficha de cada profesor</h2>
            <p className="mt-2 text-sm text-muted">Teléfono y correo quedan asociados a la materia del horario y disponibles para el grupo.</p>
          </div>
          <Pill tone="forest">{ordered.length} fichas</Pill>
        </div>
        <div className="stagger-children grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ordered.map((course) => (
            <Card key={`prof-${course.id}`} interactive className="soft-raise">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Pill>{course.code}</Pill>
                  <h3 className="mt-3 font-display text-xl leading-tight">{course.chair}</h3>
                  <p className="mt-1 text-sm text-muted">{course.name}</p>
                </div>
                <UserRound className="size-5 text-forest" />
              </div>
              <div className="mt-4 grid gap-2 border-t border-line pt-4 text-sm">
                <div className="flex items-start gap-2"><Phone className="mt-0.5 size-4 shrink-0 text-forest" />{course.professorPhone ? <a href={`tel:${course.professorPhone.replace(/[^\d+]/g, "")}`} className="break-all font-medium text-ink-soft hover:text-forest">{course.professorPhone}</a> : <span className="text-muted">Teléfono por agregar</span>}</div>
                <div className="flex items-start gap-2"><Mail className="mt-0.5 size-4 shrink-0 text-forest" />{course.professorEmail ? <a href={`mailto:${course.professorEmail}`} className="break-all font-medium text-ink-soft hover:text-forest">{course.professorEmail}</a> : <span className="text-muted">Correo por agregar</span>}</div>
                <div className="flex items-start gap-2"><Clock3 className="mt-0.5 size-4 shrink-0 text-forest" /><span className="text-ink-soft">{course.timeSlot} · {course.weekday}</span></div>
                <div className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-forest" /><span className="text-ink-soft">{course.place}</span></div>
              </div>
              {canManageCourse(course) ? (
                <button type="button" onClick={() => startEditing(course, true)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-xs font-semibold text-forest transition hover:-translate-y-0.5 hover:border-forest/30">
                  <Pencil className="size-3.5" /> Editar ficha y horario
                </button>
              ) : null}
            </Card>
          ))}
        </div>
      </section>

      <Card className="mt-8 overflow-hidden" interactive>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">Vista administrativa</p>
            <h2 className="mt-1 font-display text-3xl">Tabla actual del horario</h2>
          </div>
          <Pill tone="forest">Datos en vivo</Pill>
        </div>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="min-w-[1040px] w-full border-collapse text-sm">
            <thead className="bg-forest text-left text-bg">
              <tr>
                <th className="px-4 py-3 font-semibold">Docente</th>
                <th className="px-4 py-3 font-semibold">Clave</th>
                <th className="px-4 py-3 font-semibold">Grupo</th>
                <th className="px-4 py-3 font-semibold">Asignatura</th>
                <th className="px-4 py-3 font-semibold">Inicio</th>
                <th className="px-4 py-3 font-semibold">Fin</th>
                <th className="px-4 py-3 font-semibold">Salón</th>
                <th className="px-4 py-3 font-semibold">Teléfono</th>
                <th className="px-4 py-3 font-semibold">Correo</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((course, index) => {
                const [start = "", end = ""] = course.timeSlot.split("–");
                return (
                  <tr key={`table-${course.id}`} className={cn(index % 2 === 0 ? "bg-white" : "bg-bg-warm/55", "border-t border-line") }>
                    <td className="px-4 py-3 font-medium text-ink">{course.chair}</td>
                    <td className="px-4 py-3 font-semibold text-forest">{course.code}</td>
                    <td className="px-4 py-3">{course.group}</td>
                    <td className="px-4 py-3">{course.name}</td>
                    <td className="px-4 py-3 tabular-nums">{start}</td>
                    <td className="px-4 py-3 tabular-nums">{end}</td>
                    <td className="px-4 py-3">{course.place}</td>
                    <td className="px-4 py-3">{course.professorPhone || "—"}</td>
                    <td className="px-4 py-3">{course.professorEmail || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}
