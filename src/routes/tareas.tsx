import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  FileText,
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

const FILTERS = ["Todas", "Próximas", "Vencidas"] as const;

type Filter = (typeof FILTERS)[number];

function daysBetween(fromIso: string, toIso: string) {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

function TareasPage() {
  const { tasks, courses, books } = useBoard();
  const refresh = useRefreshBoard();
  const { user, directory } = useDirectory();
  useAreaVisit("tareas");

  const today = getTodayIso();
  const [filter, setFilter] = useState<Filter>("Todas");
  const [professorFilter, setProfessorFilter] = useState("Todos");
  const [editing, setEditing] = useState<TaskItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const professors = useMemo(
    () => Array.from(new Set(courses.map((course) => course.chair))).sort((a, b) => a.localeCompare(b, "es-MX")),
    [courses],
  );

  const visible = useMemo(() => {
    return [...tasks]
      .filter((task) => professorFilter === "Todos" || task.professorName === professorFilter)
      .filter((task) => {
        if (filter === "Próximas") return task.dueDate >= today;
        if (filter === "Vencidas") return task.dueDate < today;
        return true;
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || b.assignedDate.localeCompare(a.assignedDate));
  }, [filter, professorFilter, tasks, today]);

  const overdueCount = tasks.filter((task) => task.dueDate < today).length;
  const nextSevenCount = tasks.filter((task) => {
    const days = daysBetween(today, task.dueDate);
    return days >= 0 && days <= 7;
  }).length;

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const data = readTaskForm(new FormData(event.currentTarget), books, courses);
      await addTask({ data });
      event.currentTarget.reset();
      setSuccess("Tarea publicada para el grupo.");
      await refresh();
    } catch (cause) {
      setError(taskError(cause));
    }
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setError(null);
    setSuccess(null);
    try {
      const data = readTaskForm(new FormData(event.currentTarget), books, courses);
      await updateTask({ data: { id: editing.id, ...data } });
      setEditing(null);
      setSuccess("Tarea actualizada.");
      await refresh();
    } catch (cause) {
      setError(taskError(cause));
    }
  }

  return (
    <Shell
      eyebrow="Tareas · Grupo 9114"
      title="Qué dejaron, cuándo lo dejaron y cuándo se entrega."
      lead="Registra cada tarea por profesor y materia, relaciona libros o documentación y deja claro si debe entregarse a mano, en computadora, impresa, en línea u otro método."
    >
      <Card className="unam-hero mb-6" interactive>
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
              <ClipboardCheck className="size-4" /> Control de entregas 9114
            </div>
            <h2 className="mt-2 font-display text-3xl text-white">Una lista clara para no perder ninguna tarea.</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/75">
              El profesor se selecciona primero; después se relaciona la materia, las fechas, los recursos necesarios y la forma exacta de entrega.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-white/55">Próx. 7 días</p>
              <p className="mt-1 font-display text-3xl text-white">{nextSevenCount}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-white/55">Vencidas</p>
              <p className="mt-1 font-display text-3xl text-white">{overdueCount}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
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
        <div className="stagger-children grid gap-4">
          {visible.length ? visible.map((task) => {
            const editable = canEditPublication(directory, user?.id, task.createdBy);
            const book = task.bookId ? books.find((item) => item.id === task.bookId) : null;
            const days = daysBetween(today, task.dueDate);
            const overdue = days < 0;
            const urgent = days >= 0 && days <= 2;
            return (
              <Card key={task.id} interactive className={cn("soft-raise", overdue && "border-danger/30") }>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="forest">{task.courseCode}</Pill>
                    <Pill>{task.deliveryMethod}</Pill>
                    {overdue ? <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-danger">VENCIDA</span> : urgent ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-clay">ENTREGA PRÓXIMA</span> : null}
                  </div>
                  {editable ? (
                    <button type="button" onClick={() => { setEditing(task); setError(null); setSuccess(null); }} className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-forest">
                      <Pencil className="size-3.5" /> Editar
                    </button>
                  ) : null}
                </div>

                <h2 className="mt-3 font-display text-2xl leading-tight">{task.title}</h2>
                <p className="mt-1 text-sm font-semibold text-forest">{task.professorName}</p>
                <p className="text-sm text-muted">{task.courseName}</p>

                <div className="mt-4 grid gap-3 rounded-xl bg-bg-warm p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">La dejó</p>
                    <p className="mt-1 text-sm font-semibold">{formatLongDate(task.assignedDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Se entrega</p>
                    <p className={cn("mt-1 text-sm font-semibold", overdue && "text-danger")}>{formatLongDate(task.dueDate)}</p>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{task.instructions}</p>

                {(book || task.resourceTitle || task.documentationText || task.deliveryDetails) ? (
                  <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                    {(book || task.resourceTitle) ? (
                      <div className="rounded-lg border border-line bg-white p-3">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-forest"><BookOpen className="size-3.5" /> Recurso / libro</p>
                        <p className="mt-1 text-sm font-semibold">{book?.title || task.resourceTitle}</p>
                        {book ? <p className="mt-1 text-xs text-muted">{book.author}</p> : null}
                      </div>
                    ) : null}
                    {task.documentationText ? (
                      <div className="rounded-lg border border-line bg-white p-3">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-forest"><FileText className="size-3.5" /> Documentación</p>
                        <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{task.documentationText}</p>
                      </div>
                    ) : null}
                    {task.deliveryDetails ? (
                      <div className="rounded-lg border border-line bg-white p-3 sm:col-span-2">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-forest"><Laptop className="size-3.5" /> Detalle de entrega</p>
                        <p className="mt-1 text-sm text-ink-soft">{task.deliveryDetails}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <p className="mt-4 text-xs text-muted">Registrada por {task.authorAlias}</p>
              </Card>
            );
          }) : (
            <Card><p className="text-sm text-muted">No hay tareas que coincidan con este filtro.</p></Card>
          )}
        </div>

        <div>
          {editing ? (
            <FormBox title="Editar tarea" onSubmit={onEdit}>
              <div className="flex justify-end">
                <button type="button" onClick={() => setEditing(null)} className="inline-flex items-center gap-1 text-xs font-semibold text-forest"><X className="size-3.5" />Cancelar</button>
              </div>
              <TaskFields key={`edit-${editing.id}`} courses={courses} books={books} task={editing} />
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <Button type="submit"><Pencil className="mr-2 size-4" />Guardar cambios</Button>
            </FormBox>
          ) : (
            <PublishGate area="tareas">
              <FormBox title="Agregar tarea" onSubmit={onCreate}>
                <TaskFields courses={courses} books={books} />
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                {success ? <p className="rounded-md bg-forest-soft px-3 py-2 text-sm font-medium text-forest-deep">{success}</p> : null}
                <Button type="submit"><ClipboardCheck className="mr-2 size-4" />Publicar tarea</Button>
              </FormBox>
            </PublishGate>
          )}
        </div>
      </div>
    </Shell>
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
    <Field label="Tarea / título"><Input name="title" required maxLength={220} defaultValue={task?.title || ""} placeholder="Lectura y cuadro comparativo" /></Field>
    <Field label="Instrucciones"><Textarea name="instructions" required maxLength={2500} defaultValue={task?.instructions || ""} placeholder="Qué hay que hacer, páginas, extensión, requisitos y cualquier indicación del profesor." /></Field>
    <Field label="Libro o recurso de Biblioteca" hint="Opcional">
      <Select name="bookId" defaultValue={task?.bookId ? String(task.bookId) : ""}>
        <option value="">No depende de un libro del portal</option>
        {books.map((book) => <option key={book.id} value={book.id}>{book.title} — {book.author}</option>)}
      </Select>
    </Field>
    <Field label="Otra documentación / referencia" hint="Opcional">
      <Textarea name="documentationText" maxLength={1500} defaultValue={task?.documentationText || ""} placeholder="Ley, artículo, capítulo, liga, fotocopia, material del profesor o cualquier documento necesario." />
    </Field>
    <Field label="Método de entrega">
      <Select name="deliveryMethod" required defaultValue={task?.deliveryMethod || "A mano"}>
        {METHODS.map((method) => <option key={method}>{method}</option>)}
      </Select>
    </Field>
    <Field label="Detalle de entrega" hint="Opcional">
      <Textarea name="deliveryDetails" maxLength={600} defaultValue={task?.deliveryDetails || ""} placeholder="Ej. a mano en hojas blancas; subir PDF a Moodle; Word por correo; entregar impreso y engargolado." />
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
  return message;
}
