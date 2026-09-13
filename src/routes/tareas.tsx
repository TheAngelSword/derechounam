import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileText,
  History,
  Laptop,
  Pencil,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useRefreshBoard } from "@/components/board-context";
import { canEditPublication, useAreaVisit, useDirectory } from "@/components/directory";
import { PublishGate } from "@/components/publish-gate";
import { Button, Card, Field, FormBox, Input, Pill, Select, Textarea, cn } from "@/components/ui";
import { addTask, updateTask } from "@/lib/content";
import { formatLongDate, getTodayIso } from "@/lib/format";
import type { BookItem, Course, TaskItem } from "@/lib/types";

export const Route = createFileRoute("/tareas")({ component: TareasPage });

const METHODS: TaskItem["deliveryMethod"][] = [
  "A mano",
  "Computadora / archivo digital",
  "Impresa",
  "En línea / plataforma",
  "Oral / exposición",
  "Otro",
];

const ACTIVE_FILTERS = ["Todas activas", "Próximas 7 días"] as const;
type ActiveFilter = (typeof ACTIVE_FILTERS)[number];

function daysBetween(fromIso: string, toIso: string) {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

function excerpt(value: string, max = 190) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

function TareasPage() {
  const { tasks, courses, books } = useBoard();
  const refresh = useRefreshBoard();
  const { user, directory } = useDirectory();
  useAreaVisit("tareas");

  const today = getTodayIso();
  const [filter, setFilter] = useState<ActiveFilter>("Todas activas");
  const [professorFilter, setProfessorFilter] = useState("Todos");
  const [showPast, setShowPast] = useState(false);
  const [editing, setEditing] = useState<TaskItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const professors = useMemo(
    () => Array.from(new Set(courses.map((course) => course.chair))).sort((a, b) => a.localeCompare(b, "es-MX")),
    [courses],
  );

  const activeTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => task.dueDate >= today)
      .filter((task) => professorFilter === "Todos" || task.professorName === professorFilter)
      .filter((task) => {
        if (filter === "Próximas 7 días") {
          const days = daysBetween(today, task.dueDate);
          return days >= 0 && days <= 7;
        }
        return true;
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || b.assignedDate.localeCompare(a.assignedDate));
  }, [filter, professorFilter, tasks, today]);

  const pastTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => task.dueDate < today)
      .filter((task) => professorFilter === "Todos" || task.professorName === professorFilter)
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate) || b.assignedDate.localeCompare(a.assignedDate));
  }, [professorFilter, tasks, today]);

  const nextSevenCount = tasks.filter((task) => {
    const days = daysBetween(today, task.dueDate);
    return days >= 0 && days <= 7;
  }).length;

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const data = readTaskForm(new FormData(form), books, courses);
      await addTask({ data });
      form.reset();
      setSuccess("Tarea publicada para el grupo.");
      await refresh();
    } catch (cause) {
      setError(taskError(cause));
    } finally {
      setSaving(false);
    }
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = event.currentTarget;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const data = readTaskForm(new FormData(form), books, courses);
      await updateTask({ data: { id: editing.id, ...data } });
      setEditing(null);
      setSuccess("Tarea actualizada.");
      await refresh();
    } catch (cause) {
      setError(taskError(cause));
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(task: TaskItem) {
    setEditing(task);
    setError(null);
    setSuccess(null);
    window.setTimeout(() => document.getElementById("task-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  return (
    <Shell
      eyebrow="Tareas · Grupo 9114"
      title="Trabajos y tareas"
      lead="Las tareas vigentes permanecen en la pantalla principal. Al llegar su fecha de entrega pasan automáticamente al archivo de Tareas pasadas."
    >
      <Card className="unam-hero mb-6" interactive>
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
              <ClipboardCheck className="size-4" /> Control de entregas 9114
            </div>
            <h2 className="mt-2 font-display text-3xl text-white">Tareas vigentes al frente; las entregadas pasan al archivo.</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/75">
              Cada publicación queda vinculada con profesor, materia, fechas, bibliografía y método de entrega.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-white/55">Activas</p>
              <p className="mt-1 font-display text-3xl text-white">{tasks.filter((task) => task.dueDate >= today).length}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-white/55">Próx. 7 días</p>
              <p className="mt-1 font-display text-3xl text-white">{nextSevenCount}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-white/55">Pasadas</p>
              <p className="mt-1 font-display text-3xl text-white">{tasks.filter((task) => task.dueDate < today).length}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {ACTIVE_FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={cn(
              "min-h-11 rounded-full border px-4 text-sm font-semibold transition-all",
              filter === item ? "border-forest bg-forest text-white" : "border-line bg-white text-ink-soft hover:-translate-y-0.5",
            )}
          >
            {item}
          </button>
        ))}
        <Select value={professorFilter} onChange={(event) => setProfessorFilter(event.target.value)} className="min-w-60 sm:ml-auto">
          <option value="Todos">Todos los profesores</option>
          {professors.map((professor) => <option key={professor}>{professor}</option>)}
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <div className="min-w-0">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">Pendientes</p>
              <h2 className="font-display text-2xl">Tareas activas</h2>
            </div>
            <span className="text-sm text-muted">{activeTasks.length} en lista</span>
          </div>

          <div className="stagger-children grid gap-3">
            {activeTasks.length ? activeTasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                today={today}
                books={books}
                editable={canEditPublication(directory, user?.id, task.createdBy)}
                onEdit={() => beginEdit(task)}
              />
            )) : (
              <Card><p className="text-sm text-muted">No hay tareas activas que coincidan con este filtro.</p></Card>
            )}
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <button
              type="button"
              onClick={() => setShowPast((value) => !value)}
              className="flex min-h-12 w-full items-center justify-between rounded-xl border border-line bg-white px-4 text-left text-sm font-semibold text-ink-soft transition-all hover:border-forest/25 hover:bg-bg-warm/50"
              aria-expanded={showPast}
            >
              <span className="inline-flex items-center gap-2">
                <History className="size-4 text-forest" />
                Tareas pasadas ({pastTasks.length})
              </span>
              {showPast ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            {showPast ? (
              <div className="mt-3 grid gap-3">
                {pastTasks.length ? pastTasks.map((task) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    today={today}
                    books={books}
                    editable={canEditPublication(directory, user?.id, task.createdBy)}
                    onEdit={() => beginEdit(task)}
                    past
                  />
                )) : <Card><p className="text-sm text-muted">Todavía no hay tareas pasadas con este filtro.</p></Card>}
              </div>
            ) : null}
          </div>
        </div>

        <div id="task-editor" className="scroll-mt-6">
          {editing ? (
            <FormBox title="Editar tarea" onSubmit={onEdit}>
              <div className="flex justify-end">
                <button type="button" onClick={() => { setEditing(null); setError(null); }} className="inline-flex items-center gap-1 text-xs font-semibold text-forest"><X className="size-3.5" />Cancelar</button>
              </div>
              <TaskFields key={`edit-${editing.id}`} courses={courses} books={books} task={editing} />
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <Button type="submit" disabled={saving}><Pencil className="mr-2 size-4" />{saving ? "Guardando…" : "Guardar cambios"}</Button>
            </FormBox>
          ) : (
            <PublishGate area="tareas">
              <FormBox title="Agregar tarea" onSubmit={onCreate}>
                <TaskFields courses={courses} books={books} />
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                {success ? <p className="rounded-md bg-forest-soft px-3 py-2 text-sm font-medium text-forest-deep">{success}</p> : null}
                <Button type="submit" disabled={saving}><ClipboardCheck className="mr-2 size-4" />{saving ? "Publicando…" : "Publicar tarea"}</Button>
              </FormBox>
            </PublishGate>
          )}
        </div>
      </div>
    </Shell>
  );
}

function TaskListItem({
  task,
  today,
  books,
  editable,
  onEdit,
  past = false,
}: {
  task: TaskItem;
  today: string;
  books: BookItem[];
  editable: boolean;
  onEdit: () => void;
  past?: boolean;
}) {
  const book = task.bookId ? books.find((item) => item.id === task.bookId) : null;
  const days = daysBetween(today, task.dueDate);
  const urgent = !past && days >= 0 && days <= 2;

  return (
    <Card interactive className={cn("soft-raise px-4 py-4", past && "bg-bg-warm/45 opacity-90") }>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="forest">{task.courseCode}</Pill>
            <Pill>{task.deliveryMethod}</Pill>
            {past ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-muted">PASADA</span>
            ) : urgent ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-clay">ENTREGA PRÓXIMA</span>
            ) : null}
          </div>
          <h3 className="mt-2 font-display text-xl leading-tight">{task.title}</h3>
          <p className="mt-1 text-sm font-semibold text-forest">{task.professorName}</p>
          <p className="text-xs text-muted">{task.courseName}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{excerpt(task.instructions)}</p>
        </div>

        <div className="min-w-[9.5rem] rounded-lg bg-bg-warm px-3 py-2 text-right">
          <p className="flex items-center justify-end gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted"><CalendarClock className="size-3.5" />Entrega</p>
          <p className={cn("mt-1 text-sm font-semibold", past ? "text-muted" : urgent ? "text-clay" : "text-ink")}>{formatLongDate(task.dueDate)}</p>
          <p className="mt-1 text-xs text-muted">Dejada: {formatLongDate(task.assignedDate)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          {book || task.resourceTitle ? <span className="inline-flex items-center gap-1"><BookOpen className="size-3.5" />{book?.title || task.resourceTitle}</span> : null}
          {task.documentationText ? <span className="inline-flex items-center gap-1"><FileText className="size-3.5" />Con documentación</span> : null}
          <span>Publicó {task.authorAlias}</span>
        </div>
        {editable ? (
          <button type="button" onClick={onEdit} className="inline-flex min-h-9 items-center gap-1 rounded-md border border-line bg-white px-3 text-xs font-semibold text-forest transition-all hover:-translate-y-0.5 hover:border-forest/30">
            <Pencil className="size-3.5" />Editar
          </button>
        ) : null}
      </div>
    </Card>
  );
}

function TaskFields({ courses, books, task }: { courses: Course[]; books: BookItem[]; task?: TaskItem }) {
  const professors = useMemo(
    () => Array.from(new Set(courses.map((course) => course.chair))).sort((a, b) => a.localeCompare(b, "es-MX")),
    [courses],
  );
  const initialProfessor = task?.professorName || professors[0] || "";
  const [professor, setProfessor] = useState(initialProfessor);
  const professorCourses = courses.filter((course) => course.chair === professor);
  const initialCourse = task?.courseCode && professorCourses.some((course) => course.code === task.courseCode)
    ? task.courseCode
    : professorCourses[0]?.code || "";
  const [courseCode, setCourseCode] = useState(initialCourse);

  function onProfessorChange(value: string) {
    setProfessor(value);
    const first = courses.find((course) => course.chair === value);
    setCourseCode(first?.code || "");
  }

  return <>
    <Field label="1. Profesor" hint="Selecciona primero quién dejó la tarea">
      <Select name="professorName" required value={professor} onChange={(event) => onProfessorChange(event.target.value)}>
        {professors.map((item) => <option key={item} value={item}>{item}</option>)}
      </Select>
    </Field>
    <Field label="2. Materia">
      <Select name="courseCode" required value={courseCode} onChange={(event) => setCourseCode(event.target.value)}>
        {professorCourses.map((course) => <option key={course.id} value={course.code}>{course.code} · {course.name}</option>)}
      </Select>
    </Field>
    <div className="grid grid-cols-2 gap-3">
      <Field label="Fecha en que la dejó"><Input name="assignedDate" type="date" required defaultValue={task?.assignedDate || getTodayIso()} /></Field>
      <Field label="Fecha de entrega"><Input name="dueDate" type="date" required defaultValue={task?.dueDate || getTodayIso()} /></Field>
    </div>
    <Field label="Tarea / título"><Input name="title" required maxLength={300} defaultValue={task?.title || ""} placeholder="Lectura, cuestionario, ensayo…" /></Field>
    <Field label="Instrucciones / contenido completo" hint="Hasta 20,000 caracteres">
      <Textarea
        name="instructions"
        required
        maxLength={20000}
        rows={10}
        className="min-h-52"
        defaultValue={task?.instructions || ""}
        placeholder="Escribe aquí todas las instrucciones, preguntas, páginas, extensión, requisitos y cualquier indicación del profesor."
      />
    </Field>
    <Field label="Libro o recurso de Biblioteca" hint="Opcional">
      <Select name="bookId" defaultValue={task?.bookId ? String(task.bookId) : ""}>
        <option value="">No depende de un libro del portal</option>
        {books.map((book) => <option key={book.id} value={book.id}>{book.title} — {book.author}</option>)}
      </Select>
    </Field>
    <Field label="Otra documentación / referencia" hint="Opcional · hasta 10,000 caracteres">
      <Textarea
        name="documentationText"
        maxLength={10000}
        rows={6}
        className="min-h-36"
        defaultValue={task?.documentationText || ""}
        placeholder="Ley, artículo, capítulo, liga, fotocopia, material del profesor o cualquier documento necesario."
      />
    </Field>
    <Field label="Método de entrega">
      <Select name="deliveryMethod" required defaultValue={task?.deliveryMethod || "A mano"}>
        {METHODS.map((method) => <option key={method}>{method}</option>)}
      </Select>
    </Field>
    <Field label="Detalle de entrega" hint="Opcional · hasta 20,000 caracteres">
      <Textarea
        name="deliveryDetails"
        maxLength={20000}
        rows={10}
        className="min-h-52"
        defaultValue={task?.deliveryDetails || ""}
        placeholder="Ej. a mano en hojas blancas; subir PDF a Moodle; Word por correo; entregar impreso. También puedes poner aquí preguntas o requisitos extensos."
      />
    </Field>
  </>;
}

function readTaskForm(data: FormData, books: BookItem[], courses: Course[]) {
  const professorName = String(data.get("professorName") ?? "").trim();
  const courseCode = String(data.get("courseCode") ?? "").trim();
  const bookRaw = String(data.get("bookId") ?? "").trim();
  const bookId = bookRaw ? Number(bookRaw) : null;
  const book = bookId ? books.find((item) => item.id === bookId) : undefined;
  return {
    professorName,
    courseCode,
    courseName: courses.find((course) => course.code === courseCode && course.chair === professorName)?.name || courses.find((course) => course.code === courseCode)?.name || "Materia",
    assignedDate: String(data.get("assignedDate") ?? ""),
    dueDate: String(data.get("dueDate") ?? ""),
    title: String(data.get("title") ?? "").trim(),
    instructions: String(data.get("instructions") ?? "").trim(),
    deliveryMethod: String(data.get("deliveryMethod") ?? "A mano") as TaskItem["deliveryMethod"],
    deliveryDetails: String(data.get("deliveryDetails") ?? "").trim(),
    bookId,
    resourceTitle: book?.title || "",
    documentationText: String(data.get("documentationText") ?? "").trim(),
  };
}

function taskError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : "No se pudo guardar la tarea.";
  if (/fecha de entrega/i.test(message)) return "La fecha de entrega no puede ser anterior a la fecha en que se dejó la tarea.";
  if (/autor de la publicación|administrador/i.test(message)) return "Sólo el autor de la tarea o un administrador puede editarla.";
  if (/padrón|acceso/i.test(message)) return "Debes iniciar sesión y estar activo en el padrón para publicar.";
  if (/too_big|too big|maximum|caracter/i.test(message)) return "El contenido supera el límite permitido. Las instrucciones y el detalle admiten hasta 20,000 caracteres.";
  return message;
}
