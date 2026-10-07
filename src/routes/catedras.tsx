import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpenCheck,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  Headphones,
  Image as ImageIcon,
  LockKeyhole,
  Link2,
  MapPin,
  NotebookPen,
  Pencil,
  Plus,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useBoardStatus, useRefreshBoard } from "@/components/board-context";
import { canEditPublication, canPublish, useAreaVisit, useDirectory } from "@/components/directory";
import { Button, Card, Field, FormBox, Input, Pill, Select, Textarea, cn } from "@/components/ui";
import { PublishGate } from "@/components/publish-gate";
import { addClassMaterial, updateClassMaterial } from "@/lib/content";
import { uploadToDrive } from "@/lib/media-upload";
import { formatLongDate, getTodayIso } from "@/lib/format";
import type { ClassMaterial, Course, TaskItem } from "@/lib/types";

export const Route = createFileRoute("/catedras")({ component: CatedrasPage });

const MATERIAL_KINDS = ["Apuntes", "Tarea", "Foto", "Material", "Aviso", "Referencia", "Bibliografía"] as const;
type MaterialKind = (typeof MATERIAL_KINDS)[number];
const WEEK_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const GENERAL_COURSE_CODE = "GENERAL";
const GENERAL_PROFESSOR = "Todos los profesores · Grupo 9114";

type AcademicItem =
  | {
      key: string;
      source: "material";
      title: string;
      kind: ClassMaterial["kind"];
      courseCode: string;
      courseName: string;
      professorName: string;
      classDate: string;
      dueDate: null;
      detail: string;
      createdAt: string;
      createdBy?: string;
      material: ClassMaterial;
    }
  | {
      key: string;
      source: "task";
      title: string;
      kind: "Tarea";
      courseCode: string;
      courseName: string;
      professorName: string;
      classDate: string;
      dueDate: string;
      detail: string;
      createdAt: string;
      createdBy?: string;
      task: TaskItem;
    };
const GENERAL_COURSE: Course = {
  id: -9114,
  code: GENERAL_COURSE_CODE,
  name: "General · Todas las clases",
  chair: GENERAL_PROFESSOR,
  modality: "General",
  weekday: "Todos los días",
  timeSlot: "00:00–23:59",
  place: "Grupo 9114",
  semester: "Primer semestre",
  group: "9114",
};

function normalizeUrl(value: string) {
  const trimmed = value.trim().replace(/\s+/g, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function kindIcon(kind: ClassMaterial["kind"]) {
  if (kind === "Apuntes") return NotebookPen;
  if (kind === "Tarea") return BookOpenCheck;
  if (kind === "Foto") return Camera;
  if (kind === "Material") return FileText;
  return Link2;
}

function isImageFile(material: ClassMaterial) {
  if (!material.fileUrl) return false;
  return /\.(jpe?g|png|webp)(\?.*)?$/i.test(material.fileUrl) || /\.(jpe?g|png|webp)$/i.test(material.fileName ?? "");
}

function parseIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

function makeIso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthLabel(iso: string) {
  const { year, month } = parseIso(iso);
  return new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function shiftMonth(iso: string, delta: number) {
  const { year, month } = parseIso(iso);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return makeIso(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
}

function monthCells(monthIso: string) {
  const { year, month } = parseIso(monthIso);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  return [
    ...Array.from({ length: mondayOffset }, () => null),
    ...Array.from({ length: days }, (_, index) => makeIso(year, month, index + 1)),
  ];
}

function weekdayIndex(iso: string) {
  const { year, month, day } = parseIso(iso);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function CatedrasPage() {
  const { courses, professors, materials, tasks } = useBoard();
  const refresh = useRefreshBoard();
  const boardStatus = useBoardStatus();
  const { user, directory, isSessionPending, isLoading: isDirectoryLoading } = useDirectory();
  useAreaVisit("catedras");

  const ordered = useMemo(() => [...courses].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot)), [courses]);
  const formCourses = useMemo(() => [GENERAL_COURSE, ...ordered], [ordered]);
  const professorOptions = useMemo(
    () => Array.from(new Set([GENERAL_PROFESSOR, ...ordered.map((course) => course.chair), ...professors.map((professor) => professor.fullTitle)])).filter(Boolean),
    [ordered, professors],
  );

  const today = getTodayIso();
  const [selectedDate, setSelectedDate] = useState(today);
  const [monthCursor, setMonthCursor] = useState(`${today.slice(0, 7)}-01`);
  const [selectedCourseCode, setSelectedCourseCode] = useState(ordered[0]?.code ?? "");
  const [selectedProfessor, setSelectedProfessor] = useState(ordered[0]?.chair ?? professorOptions[0] ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<ClassMaterial | null>(null);
  const [resourceNotice, setResourceNotice] = useState(false);
  const [expandedAcademicKey, setExpandedAcademicKey] = useState<string | null>(null);
  const resourceAllowed = canPublish(directory);
  const showAccessBanner = !isSessionPending && !isDirectoryLoading && (!user || !directory?.me || directory.me.status !== "activo");

  const cells = useMemo(() => monthCells(monthCursor), [monthCursor]);
  const entriesByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const material of materials) map.set(material.classDate, (map.get(material.classDate) ?? 0) + 1);
    for (const task of tasks) map.set(task.assignedDate, (map.get(task.assignedDate) ?? 0) + 1);
    return map;
  }, [materials, tasks]);
  const selectedMaterials = useMemo(
    () => materials
      .filter((item) => item.classDate === selectedDate)
      .sort((a, b) => {
        if (a.courseCode === GENERAL_COURSE_CODE && b.courseCode !== GENERAL_COURSE_CODE) return -1;
        if (b.courseCode === GENERAL_COURSE_CODE && a.courseCode !== GENERAL_COURSE_CODE) return 1;
        return a.courseCode.localeCompare(b.courseCode);
      }),
    [materials, selectedDate],
  );
  const selectedTasks = useMemo(
    () => tasks
      .filter((task) => task.assignedDate === selectedDate)
      .sort((a, b) => a.courseCode.localeCompare(b.courseCode) || a.dueDate.localeCompare(b.dueDate)),
    [tasks, selectedDate],
  );
  const academicItems = useMemo<AcademicItem[]>(() => {
    const materialItems: AcademicItem[] = materials.map((material) => ({
      key: `material-${material.id}`,
      source: "material",
      title: material.title,
      kind: material.kind,
      courseCode: material.courseCode,
      courseName: material.courseName,
      professorName: material.professorName,
      classDate: material.classDate,
      dueDate: null,
      detail: material.body || material.audioLabel || material.referencesText || material.bibliographyText || "Sin descripción adicional.",
      createdAt: material.createdAt,
      createdBy: material.createdBy,
      material,
    }));
    const taskItems: AcademicItem[] = tasks.map((task) => ({
      key: `task-${task.id}`,
      source: "task",
      title: task.title,
      kind: "Tarea",
      courseCode: task.courseCode,
      courseName: task.courseName,
      professorName: task.professorName,
      classDate: task.assignedDate,
      dueDate: task.dueDate,
      detail: task.instructions || task.deliveryDetails || task.documentationText || "Tarea sin instrucciones adicionales.",
      createdAt: task.createdAt,
      createdBy: task.createdBy,
      task,
    }));
    return [...materialItems, ...taskItems].sort((a, b) => {
      const createdDelta = Date.parse(b.createdAt) - Date.parse(a.createdAt);
      if (Number.isFinite(createdDelta) && createdDelta !== 0) return createdDelta;
      return b.classDate.localeCompare(a.classDate);
    });
  }, [materials, tasks]);
  const latestAcademicItems = useMemo(() => academicItems.slice(0, 6), [academicItems]);
  const selectedAcademicItems = useMemo(
    () => academicItems.filter((item) => item.classDate === selectedDate),
    [academicItems, selectedDate],
  );
  const expandedAcademicItem = useMemo(
    () => academicItems.find((item) => item.key === expandedAcademicKey) ?? null,
    [academicItems, expandedAcademicKey],
  );
  const isClassDay = weekdayIndex(selectedDate) >= 1 && weekdayIndex(selectedDate) <= 5;
  const scheduledCourses = isClassDay ? ordered : [];

  function chooseCourse(code: string) {
    setSelectedCourseCode(code);
    const course = formCourses.find((item) => item.code === code);
    if (course) setSelectedProfessor(course.chair);
  }

  function prepareEntry(course: Course) {
    chooseCourse(course.code);
    setEditingMaterial(null);
    setError(null);
    setSuccess(null);
    requestAnimationFrame(() => document.getElementById("catedra-form")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function uploadAttachment(file: FormDataEntryValue | null, courseCode: string, classDate: string) {
    if (!(file instanceof File) || file.size === 0) return null;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf","doc","docx","txt","jpg","jpeg","png","webp","mp3","m4a","ogg","wav","mp4","webm"].includes(ext)) throw new Error("Formato no permitido. Usa un documento, foto, audio o video compatible.");
    if (file.size > 512 * 1024 * 1024) throw new Error("El archivo supera el límite de 512 MB.");
    const [year, month] = classDate.split("-");
    const stored = await uploadToDrive({ file, category: "catedras", subfolder: `${courseCode}/${year}/${month}`, onProgress: setUploadProgress });
    return { url: stored.url, name: file.name };
  }

  function readMaterial(data: FormData) {
    const courseCode = String(data.get("courseCode") ?? "");
    const course = formCourses.find((item) => item.code === courseCode);
    if (!course) throw new Error("Selecciona una materia o la categoría General.");
    const professorName = String(data.get("professorName") ?? "").trim();
    if (!professorName) throw new Error("Selecciona al profesor de la clase.");
    return {
      course,
      professorName,
      classDate: String(data.get("classDate") ?? selectedDate),
      kind: String(data.get("kind") ?? "Apuntes") as MaterialKind,
      title: String(data.get("title") ?? "").trim(),
      body: String(data.get("body") ?? "").trim(),
      referencesText: String(data.get("referencesText") ?? "").trim(),
      bibliographyText: String(data.get("bibliographyText") ?? "").trim(),
      audioUrl: normalizeUrl(String(data.get("audioUrl") ?? "")),
      audioLabel: String(data.get("audioLabel") ?? "").trim(),
      externalUrl: normalizeUrl(String(data.get("externalUrl") ?? "")),
      removeAudioUrl: data.get("removeAudioUrl") === "on",
      removeExternalUrl: data.get("removeExternalUrl") === "on",
    };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null); setSuccess(null); setBusy(true); setUploadProgress(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const values = readMaterial(data);
      const attachment = data.get("attachment");
      const hasAttachment = attachment instanceof File && attachment.size > 0;
      const audioFile = data.get("audioFile");
      const hasAudioFile = audioFile instanceof File && audioFile.size > 0;
      if (hasAudioFile && !/\.(mp3|m4a|ogg|wav)$/i.test(audioFile.name)) throw new Error("Para audio usa MP3, M4A, OGG o WAV.");
      const hasContent = Boolean(values.title || values.body || values.referencesText || values.bibliographyText || values.audioUrl || values.externalUrl || hasAttachment || hasAudioFile);
      if (!hasContent) throw new Error("Agrega al menos un tema, apuntes, audio, archivo, referencia, bibliografía o liga complementaria.");
      const title = values.title || values.audioLabel || `${values.kind} · ${values.course.name}`;
      const uploaded = await uploadAttachment(attachment, values.course.code, values.classDate);
      const uploadedAudio = await uploadAttachment(audioFile, values.course.code, values.classDate);
      const saved = await addClassMaterial({ data: {
        courseCode: values.course.code,
        courseName: values.course.name,
        professorName: values.professorName,
        classDate: values.classDate,
        kind: values.kind,
        title,
        body: values.body,
        referencesText: values.referencesText,
        bibliographyText: values.bibliographyText,
        audioUrl: uploadedAudio?.url || values.audioUrl,
        audioLabel: values.audioLabel || uploadedAudio?.name || "",
        fileUrl: uploaded?.url ?? "",
        fileName: uploaded?.name ?? "",
        externalUrl: values.externalUrl,
      } });
      await refresh();
      form.reset();
      setSelectedDate(values.classDate);
      setMonthCursor(`${values.classDate.slice(0, 7)}-01`);
      chooseCourse(values.course.code);
      setExpandedAcademicKey(`material-${saved.id}`);
      const savedResources = [saved.audioUrl ? "audio" : "", saved.externalUrl ? "liga complementaria" : "", saved.fileUrl ? "archivo" : ""].filter(Boolean);
      setSuccess(savedResources.length ? `Sesión guardada. Recursos confirmados: ${savedResources.join(", ")}.` : "Sesión guardada en el calendario académico.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la sesión.");
    } finally { setBusy(false); }
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingMaterial) return;
    setError(null); setSuccess(null); setBusy(true); setUploadProgress(null);
    const data = new FormData(event.currentTarget);
    try {
      const values = readMaterial(data);
      const attachment = data.get("attachment");
      const hasAttachment = attachment instanceof File && attachment.size > 0;
      const audioFile = data.get("audioFile");
      const hasAudioFile = audioFile instanceof File && audioFile.size > 0;
      if (hasAudioFile && !/\.(mp3|m4a|ogg|wav)$/i.test(audioFile.name)) throw new Error("Para audio usa MP3, M4A, OGG o WAV.");
      const hasExistingResource = Boolean(editingMaterial.fileUrl || editingMaterial.audioUrl || editingMaterial.externalUrl);
      const hasContent = Boolean(values.title || values.body || values.referencesText || values.bibliographyText || values.audioUrl || values.externalUrl || hasAttachment || hasAudioFile || hasExistingResource);
      if (!hasContent) throw new Error("Agrega al menos un tema, apuntes, audio, archivo, referencia, bibliografía o liga complementaria.");
      const title = values.title || values.audioLabel || editingMaterial.title || `${values.kind} · ${values.course.name}`;
      const uploaded = await uploadAttachment(attachment, values.course.code, values.classDate);
      const uploadedAudio = await uploadAttachment(audioFile, values.course.code, values.classDate);
      const audioUrl = values.removeAudioUrl ? "" : (uploadedAudio?.url || values.audioUrl || editingMaterial.audioUrl || "");
      const audioLabel = values.removeAudioUrl ? "" : (values.audioLabel || uploadedAudio?.name || editingMaterial.audioLabel || "");
      const externalUrl = values.removeExternalUrl ? "" : (values.externalUrl || editingMaterial.externalUrl || "");
      const saved = await updateClassMaterial({ data: {
        id: editingMaterial.id,
        courseCode: values.course.code,
        courseName: values.course.name,
        professorName: values.professorName,
        classDate: values.classDate,
        kind: values.kind,
        title,
        body: values.body,
        referencesText: values.referencesText,
        bibliographyText: values.bibliographyText,
        audioUrl,
        audioLabel,
        fileUrl: uploaded?.url ?? editingMaterial.fileUrl ?? "",
        fileName: uploaded?.name ?? editingMaterial.fileName ?? "",
        externalUrl,
      } });
      await refresh();
      setSelectedDate(values.classDate);
      setMonthCursor(`${values.classDate.slice(0, 7)}-01`);
      setEditingMaterial(null);
      setExpandedAcademicKey(`material-${saved.id}`);
      const savedResources = [saved.audioUrl ? "audio" : "", saved.externalUrl ? "liga complementaria" : "", saved.fileUrl ? "archivo" : ""].filter(Boolean);
      setSuccess(savedResources.length ? `Sesión actualizada. Recursos confirmados: ${savedResources.join(", ")}.` : "Sesión actualizada.");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo guardar.";
      setError(/autor de la publicación|administrador/i.test(message) ? "Sólo el autor o un administrador puede editar esta sesión." : message);
    } finally { setBusy(false); }
  }

  function openAcademicItem(item: AcademicItem) {
    setSelectedDate(item.classDate);
    setMonthCursor(`${item.classDate.slice(0, 7)}-01`);
    setExpandedAcademicKey(item.key);
    setEditingMaterial(null);
    setError(null);
    setSuccess(null);
    window.setTimeout(() => document.getElementById("catedras-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function blockResource() {
    setResourceNotice(true);
    window.setTimeout(() => document.getElementById("catedras-resource-notice")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  return (
    <Shell
      eyebrow="Cátedras · Grupo 9114"
      title="Calendario de clases y expediente académico."
      lead="Selecciona un día para revisar qué materias se cursaron y documenta cada sesión con profesor, tema, apuntes, tareas, fotografías, referencias, bibliografía y audios."
    >
      {boardStatus.isError ? (
        <div role="alert" className="mb-6 rounded-xl border border-danger/25 bg-red-50 px-4 py-3 text-sm text-danger">
          <strong>No se pudo sincronizar con la base de datos.</strong> El portal está mostrando datos de respaldo y por eso una publicación o edición puede parecer que no se guardó. Vuelve a desplegar después de aplicar las migraciones pendientes.
        </div>
      ) : null}
      {showAccessBanner ? (
        <div className="mb-6 rounded-xl border border-clay/25 bg-clay/10 px-4 py-4 text-sm text-ink-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display text-xl text-ink">Regístrate para tener acceso a todos los recursos del portal.</p>
              <p className="mt-1 text-sm text-muted">Puedes consultar la información general, pero para abrir audios, tareas y demás recursos necesitas una cuenta activa.</p>
            </div>
            {!user ? (
              <Link to="/login" search={{ mode: "alta" }} className="inline-flex min-h-11 items-center rounded-md bg-forest px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5">
                Inicia tu registro
              </Link>
            ) : (
              <Link to="/registro" className="inline-flex min-h-11 items-center rounded-md bg-forest px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5">
                Completa tu registro
              </Link>
            )}
          </div>
        </div>
      ) : null}
      {resourceNotice ? (
        <div id="catedras-resource-notice" role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-clay/25 bg-clay/10 px-4 py-3 text-sm text-ink-soft">
          <span className="inline-flex items-center gap-2"><LockKeyhole className="size-4 text-clay" /><strong>Regístrate para poder usar los recursos.</strong> Puedes ver el resumen, pero para abrir audios, tareas y archivos necesitas una cuenta activa.</span>
          {!user ? (
            <Link to="/login" search={{ mode: "alta" }} className="rounded-md bg-forest px-3 py-2 font-semibold text-white">Inicia tu registro</Link>
          ) : (
            <Link to="/registro" className="rounded-md bg-forest px-3 py-2 font-semibold text-white">Completa tu registro</Link>
          )}
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,.85fr)]">
        <Card className="overflow-hidden p-0">
          <div className="unam-hero px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">Calendario académico 9114</p>
                <h2 className="mt-1 font-display text-3xl capitalize text-white">{monthLabel(monthCursor)}</h2>
                <p className="mt-1 text-sm text-white/70">Los números dorados indican cuántos registros académicos hay guardados en cada fecha.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setMonthCursor(shiftMonth(monthCursor, -1))} className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20" aria-label="Mes anterior"><ChevronLeft className="size-5" /></button>
                <button type="button" onClick={() => { setMonthCursor(`${today.slice(0, 7)}-01`); setSelectedDate(today); }} className="rounded-full border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20">Hoy</button>
                <button type="button" onClick={() => setMonthCursor(shiftMonth(monthCursor, 1))} className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20" aria-label="Mes siguiente"><ChevronRight className="size-5" /></button>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">{WEEK_LABELS.map((label) => <span key={label} className="py-2">{label}</span>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((iso, index) => {
                if (!iso) return <div key={`blank-${index}`} className="aspect-square" />;
                const count = entriesByDate.get(iso) ?? 0;
                const active = iso === selectedDate;
                const isToday = iso === today;
                const week = weekdayIndex(iso);
                const weekday = week >= 1 && week <= 5;
                return (
                  <button key={iso} type="button" onClick={() => setSelectedDate(iso)} className={cn("relative aspect-square rounded-xl border p-1 text-left transition-all duration-200 hover:-translate-y-0.5", active ? "border-forest bg-forest text-white shadow-md" : "border-transparent hover:border-line hover:bg-white", isToday && !active && "bg-forest-soft text-forest-deep")}>
                    <span className="text-sm font-semibold">{Number(iso.slice(-2))}</span>
                    {weekday ? <span className={cn("absolute bottom-2 left-2 size-1.5 rounded-full", active ? "bg-white/70" : "bg-line-strong")} /> : null}
                    {count ? <span className={cn("absolute bottom-1.5 right-1.5 grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold", active ? "bg-clay-soft text-forest-deep" : "bg-clay/15 text-clay")}>{count}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="self-start">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">Día seleccionado</p>
              <h2 className="mt-1 font-display text-3xl capitalize">{formatLongDate(selectedDate)}</h2>
            </div>
            <Pill tone="forest">{selectedMaterials.length + selectedTasks.length} registros</Pill>
          </div>
          <p className="mt-2 text-sm text-muted">{isClassDay ? `${scheduledCourses.length} materias programadas en el horario del grupo.` : "No hay clases regulares programadas para este día."}</p>
          <div className="mt-5 grid gap-2">
            {scheduledCourses.map((course) => {
              const count = selectedMaterials.filter((item) => item.courseCode === course.code).length;
              const taskCount = selectedTasks.filter((task) => task.courseCode === course.code).length;
              return (
                <div key={course.code} className="grid gap-3 rounded-xl border border-line bg-bg-warm/55 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><Pill>{course.code}</Pill>{count ? <Pill tone="forest">{count} registro{count === 1 ? "" : "s"}</Pill> : null}{taskCount ? <Pill tone="clay">{taskCount} tarea{taskCount === 1 ? "" : "s"}</Pill> : null}</div>
                    <p className="mt-2 font-semibold">{course.name}</p>
                    <p className="mt-1 text-xs text-muted">{course.timeSlot} · {course.place}</p>
                    <p className="mt-1 text-xs font-medium text-forest">{course.chair}</p>
                  </div>
                  <button type="button" onClick={() => prepareEntry(course)} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-forest transition hover:-translate-y-0.5"><Plus className="size-3.5" />Registrar</button>
                </div>
              );
            })}
            {!scheduledCourses.length ? <p className="rounded-xl bg-bg-warm p-4 text-sm text-muted">Puedes elegir otra fecha del calendario o registrar una actividad extraordinaria usando el formulario.</p> : null}
          </div>

          {selectedAcademicItems.length ? (
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay">Registros de este día</p>
              <div className="mt-3 grid gap-2">
                {selectedAcademicItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => openAcademicItem(item)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-forest/30 hover:bg-white",
                      expandedAcademicKey === item.key ? "border-forest/35 bg-forest-soft" : "border-line bg-bg-warm/55",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2"><Pill tone={item.source === "task" ? "clay" : "forest"}>{item.kind}</Pill><span className="text-xs text-muted">{item.courseCode === GENERAL_COURSE_CODE ? "General" : item.courseCode}</span></span>
                      <span className="mt-1 block truncate text-sm font-semibold text-ink">{item.title}</span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-forest">Ver contenido</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <section id="catedras-expediente" className="mt-7 scroll-mt-6">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">Actividad reciente</p>
          <h2 className="mt-1 font-display text-3xl">Últimos registros</h2>
          <p className="mt-1 text-sm text-muted">Las 6 publicaciones académicas más recientes del grupo, incluyendo apuntes, audios, materiales y tareas.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(21rem,1fr)]">
          <Card className="overflow-hidden p-0">
            {latestAcademicItems.length ? (
              <div className="divide-y divide-line">
                {latestAcademicItems.map((recent) => {
                  const summary = recent.detail.replace(/\s+/g, " ").trim();
                  const shortSummary = summary.length > 190 ? `${summary.slice(0, 187).trimEnd()}…` : summary;
                  return (
                    <article key={recent.key} className="px-5 py-4 transition-colors hover:bg-bg-warm/55">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone={recent.kind === "Tarea" ? "clay" : "forest"}>{recent.kind}</Pill>
                        <Pill tone={recent.courseCode === GENERAL_COURSE_CODE ? "clay" : "neutral"}>
                          {recent.courseCode === GENERAL_COURSE_CODE ? "General" : recent.courseCode}
                        </Pill>
                        <span className="text-xs text-muted">{formatLongDate(recent.classDate)}</span>
                        {recent.dueDate ? <span className="text-xs font-semibold text-danger">Entrega {formatLongDate(recent.dueDate)}</span> : null}
                      </div>

                      <h3 className="mt-2 font-display text-xl leading-tight text-ink">{recent.title}</h3>
                      <p className="mt-1 text-xs font-medium text-forest">
                        {recent.courseCode === GENERAL_COURSE_CODE ? "Todas las clases" : recent.courseName} · {recent.professorName}
                      </p>
                      {shortSummary ? <p className="mt-2 text-sm leading-relaxed text-muted">{shortSummary}</p> : null}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openAcademicItem(recent)}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-line bg-white px-3 text-xs font-semibold text-forest transition hover:-translate-y-0.5 hover:border-forest/30"
                        >
                          <ExternalLink className="size-3.5" />Ver contenido
                        </button>
                        {recent.source === "task" ? (
                          resourceAllowed ? (
                            <a href={`/tareas#tarea-${recent.task.id}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-forest px-3 text-xs font-semibold text-white transition hover:-translate-y-0.5">
                              <BookOpenCheck className="size-3.5" />Ir a la tarea
                            </a>
                          ) : (
                            <button type="button" onClick={blockResource} className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-clay/25 bg-clay/10 px-3 text-xs font-semibold text-clay">
                              <LockKeyhole className="size-3.5" />Regístrate para abrir
                            </button>
                          )
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 text-sm text-muted">Todavía no hay registros académicos publicados.</div>
            )}
          </Card>

          {expandedAcademicItem ? (
            <AcademicDetail
              item={expandedAcademicItem}
              resourceAllowed={resourceAllowed}
              canEditMaterial={expandedAcademicItem.source === "material" && canEditPublication(directory, user?.id, expandedAcademicItem.material.createdBy)}
              onEditMaterial={(material) => {
                setEditingMaterial(material);
                setSelectedDate(material.classDate);
                setMonthCursor(`${material.classDate.slice(0, 7)}-01`);
                setSelectedCourseCode(material.courseCode);
                setSelectedProfessor(material.professorName);
                window.setTimeout(() => document.getElementById("catedra-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
              }}
              onBlockResource={blockResource}
              onClose={() => setExpandedAcademicKey(null)}
            />
          ) : null}

          <div id="catedra-form" className="scroll-mt-6 lg:sticky lg:top-6 lg:self-start">
            {editingMaterial ? (
              <FormBox title="Editar sesión de clase" onSubmit={onEdit}>
                <div className="flex items-center justify-between rounded-lg bg-clay/10 p-3 text-xs"><span>Editando un registro existente.</span><button type="button" onClick={() => setEditingMaterial(null)} className="inline-flex items-center gap-1 font-semibold text-forest"><X className="size-3.5" />Cancelar</button></div>
                <MaterialFields key={`edit-${editingMaterial.id}`} courses={formCourses} professorOptions={professorOptions} material={editingMaterial} selectedDate={selectedDate} editMode />
                {uploadProgress !== null ? <p className="text-sm text-muted">Subiendo archivo: {uploadProgress}%</p> : null}
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                <Button type="submit" disabled={busy} className="gap-2"><Pencil className="size-4" />{busy ? "Guardando…" : "Guardar cambios"}</Button>
              </FormBox>
            ) : (
              <PublishGate area="catedras">
                <FormBox title="Registrar lo visto en clase" onSubmit={onSubmit}>
                  <MaterialFields key={`${selectedDate}-${selectedCourseCode}-${selectedProfessor}`} courses={formCourses} professorOptions={professorOptions} selectedDate={selectedDate} selectedCourseCode={selectedCourseCode} selectedProfessor={selectedProfessor} onCourseChange={chooseCourse} onProfessorChange={setSelectedProfessor} />
                  {uploadProgress !== null ? <p className="text-sm text-muted">Subiendo archivo: {uploadProgress}%</p> : null}
                  {error ? <p className="text-sm text-danger">{error}</p> : null}
                  {success ? <p className="text-sm text-forest">{success}</p> : null}
                  <Button type="submit" disabled={busy} className="gap-2"><UploadCloud className="size-4" />{busy ? "Guardando…" : "Guardar sesión"}</Button>
                </FormBox>
              </PublishGate>
            )}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function AcademicDetail({
  item,
  resourceAllowed,
  canEditMaterial,
  onEditMaterial,
  onBlockResource,
  onClose,
}: {
  item: AcademicItem;
  resourceAllowed: boolean;
  canEditMaterial: boolean;
  onEditMaterial: (material: ClassMaterial) => void;
  onBlockResource: () => void;
  onClose: () => void;
}) {
  return (
    <Card id="catedras-detail" className="scroll-mt-6 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={item.source === "task" ? "clay" : "forest"}>{item.kind}</Pill>
            <Pill>{item.courseCode === GENERAL_COURSE_CODE ? "General" : item.courseCode}</Pill>
            <span className="text-xs text-muted">{formatLongDate(item.classDate)}</span>
            {item.dueDate ? <span className="text-xs font-semibold text-danger">Entrega {formatLongDate(item.dueDate)}</span> : null}
          </div>
          <h3 className="mt-3 font-display text-3xl leading-tight">{item.title}</h3>
          <p className="mt-1 text-sm font-semibold text-forest">{item.courseName} · {item.professorName}</p>
        </div>
        <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full border border-line bg-white text-muted" aria-label="Cerrar contenido"><X className="size-4" /></button>
      </div>

      {item.source === "material" ? (
        <div className="mt-5 grid gap-4">
          {item.material.body ? <DetailBlock title="Apuntes / contenido"><p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{item.material.body}</p></DetailBlock> : null}
          {item.material.referencesText ? <DetailBlock title="Referencias"><p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{item.material.referencesText}</p></DetailBlock> : null}
          {item.material.bibliographyText ? <DetailBlock title="Bibliografía"><p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{item.material.bibliographyText}</p></DetailBlock> : null}

          <DetailBlock title="Recursos y enlaces">
            {(item.material.audioUrl || item.material.fileUrl || item.material.externalUrl) ? (
              <div className="grid gap-3">
                {item.material.audioUrl ? (
                  <div className="rounded-lg border border-line bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-clay">Audio</p>
                    <p className="mt-1 break-all text-xs text-muted">{item.material.audioUrl}</p>
                    <div className="mt-2">
                      {resourceAllowed ? <a href={item.material.audioUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-forest px-3 text-xs font-semibold text-white"><Headphones className="size-3.5" />{item.material.audioLabel || "Abrir audio"}</a>
                        : <LockedResourceButton onClick={onBlockResource} label="Audio protegido" />}
                    </div>
                  </div>
                ) : null}
                {item.material.fileUrl ? (
                  <div className="rounded-lg border border-line bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-clay">Archivo</p>
                    <p className="mt-1 break-all text-xs text-muted">{item.material.fileName || item.material.fileUrl}</p>
                    <div className="mt-2">
                      {resourceAllowed ? <a href={item.material.fileUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-line bg-white px-3 text-xs font-semibold text-forest"><FileText className="size-3.5" />{item.material.fileName || (isImageFile(item.material) ? "Ver fotografía" : "Abrir archivo")}</a>
                        : <LockedResourceButton onClick={onBlockResource} label="Archivo protegido" />}
                    </div>
                  </div>
                ) : null}
                {item.material.externalUrl ? (
                  <div className="rounded-lg border border-line bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-clay">Liga complementaria</p>
                    <p className="mt-1 break-all text-xs text-muted">{item.material.externalUrl}</p>
                    <div className="mt-2">
                      {resourceAllowed ? <a href={item.material.externalUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-line bg-white px-3 text-xs font-semibold text-forest"><ExternalLink className="size-3.5" />Abrir liga complementaria</a>
                        : <LockedResourceButton onClick={onBlockResource} label="Liga protegida" />}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted">Este registro no tiene ninguna liga o archivo guardado.</p>
            )}
          </DetailBlock>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted">
            <span>Publicado por {item.material.authorAlias}</span>
            {canEditMaterial ? <button type="button" onClick={() => onEditMaterial(item.material)} className="inline-flex min-h-9 items-center gap-1 rounded-md border border-line bg-white px-3 font-semibold text-forest"><Pencil className="size-3.5" />Editar registro</button> : null}
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          <DetailBlock title="Instrucciones de la tarea"><p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{item.task.instructions}</p></DetailBlock>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailBlock title="Entrega"><p className="text-sm text-ink-soft">{formatLongDate(item.task.dueDate)} · {item.task.deliveryMethod}</p>{item.task.deliveryDetails ? <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{item.task.deliveryDetails}</p> : null}</DetailBlock>
            <DetailBlock title="Recurso asociado"><p className="text-sm text-ink-soft">{item.task.resourceTitle || "No depende de un libro del portal."}</p></DetailBlock>
          </div>
          {item.task.documentationText ? <DetailBlock title="Documentación / referencia"><p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{item.task.documentationText}</p></DetailBlock> : null}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <span className="text-xs text-muted">Publicó {item.task.authorAlias}</span>
            {resourceAllowed ? (
              <a href={`/tareas#tarea-${item.task.id}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-forest px-3 text-xs font-semibold text-white transition hover:-translate-y-0.5"><BookOpenCheck className="size-3.5" />Ir a la tarea completa</a>
            ) : (
              <LockedResourceButton onClick={onBlockResource} label="Regístrate para abrir la tarea" />
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-line bg-bg-warm/45 p-4"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-clay">{title}</p>{children}</div>;
}

function LockedResourceButton({ onClick, label }: { onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick} className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-clay/25 bg-clay/10 px-3 text-xs font-semibold text-clay"><LockKeyhole className="size-3.5" />{label}</button>;
}

function MaterialFields({
  courses,
  professorOptions,
  material,
  selectedDate,
  selectedCourseCode,
  selectedProfessor,
  onCourseChange,
  onProfessorChange,
  editMode = false,
}: {
  courses: Course[];
  professorOptions: string[];
  material?: ClassMaterial;
  selectedDate: string;
  selectedCourseCode?: string;
  selectedProfessor?: string;
  onCourseChange?: (code: string) => void;
  onProfessorChange?: (name: string) => void;
  editMode?: boolean;
}) {
  const courseValue = material?.courseCode ?? selectedCourseCode ?? courses[0]?.code ?? "";
  const professorValue = material?.professorName ?? selectedProfessor ?? courses.find((course) => course.code === courseValue)?.chair ?? professorOptions[0] ?? "";
  return <>
    <Field label="Fecha de la clase"><Input name="classDate" type="date" required defaultValue={material?.classDate ?? selectedDate} /></Field>
    <Field label="Materia / categoría" hint="Usa General si aplica a todo el grupo">{material ? <Select name="courseCode" required defaultValue={courseValue}>{courses.map((course) => <option key={course.code} value={course.code}>{course.code === GENERAL_COURSE_CODE ? course.name : `${course.code} · ${course.name}`}</option>)}</Select> : <Select name="courseCode" required value={courseValue} onChange={(event) => onCourseChange?.(event.target.value)}>{courses.map((course) => <option key={course.code} value={course.code}>{course.code === GENERAL_COURSE_CODE ? course.name : `${course.code} · ${course.name}`}</option>)}</Select>}</Field>
    <Field label="Profesor">{material ? <Select name="professorName" required defaultValue={professorValue}>{professorOptions.map((name) => <option key={name} value={name}>{name}</option>)}</Select> : <Select name="professorName" required value={professorValue} onChange={(event) => onProfessorChange?.(event.target.value)}>{professorOptions.map((name) => <option key={name} value={name}>{name}</option>)}</Select>}</Field>
    <Field label="Tipo de registro"><Select name="kind" defaultValue={material?.kind ?? "Apuntes"}>{MATERIAL_KINDS.map((kind) => <option key={kind}>{kind}</option>)}</Select></Field>
    <Field label="Tema de la clase" hint="Opcional si adjuntas otro recurso"><Input name="title" defaultValue={material?.title ?? ""} placeholder="Ej. Personas en el Derecho Romano" /></Field>
    <Field label="Apuntes / qué se vio" hint="Opcional si adjuntas audio, archivo o referencia"><Textarea name="body" defaultValue={material?.body ?? ""} placeholder="Resumen de la clase, conceptos, indicaciones, ejemplos y tareas." /></Field>
    <Field label="Referencias" hint="Opcional"><Textarea name="referencesText" defaultValue={material?.referencesText ?? ""} placeholder="Artículos, leyes, páginas, sentencias, autores o ligas mencionadas en clase." /></Field>
    <Field label="Bibliografía" hint="Opcional"><Textarea name="bibliographyText" defaultValue={material?.bibliographyText ?? ""} placeholder="Autor, título, editorial, edición, páginas o capítulos recomendados." /></Field>
    <div className="rounded-lg border border-forest/10 bg-forest-soft p-3">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-forest"><Headphones className="size-3.5" />Audio de la clase</p>
      <p className="mb-3 text-xs leading-relaxed text-muted">Sube un audio a la carpeta autorizada de Google Drive o conserva una liga externa existente. Si eliges un archivo nuevo, éste reemplaza la liga de audio.</p>
      <Field label="Subir audio a Drive" hint="MP3, M4A, OGG, WAV · hasta 512 MB"><Input name="audioFile" type="file" accept=".mp3,.m4a,.ogg,.wav" /></Field>
      <Field label="Liga del audio" hint="Opcional"><Input name="audioUrl" type="url" inputMode="url" maxLength={4000} defaultValue={material?.audioUrl ?? ""} placeholder="https://drive.google.com/..." /></Field>
      <Field label="Nombre / descripción del audio" hint="Opcional"><Input name="audioLabel" maxLength={180} defaultValue={material?.audioLabel ?? ""} placeholder="Podcast de la clase / resumen del tema" /></Field>
      {editMode && material?.audioUrl ? <label className="flex items-center gap-2 text-xs text-muted"><input name="removeAudioUrl" type="checkbox" className="size-4" />Quitar la liga de audio guardada</label> : null}
    </div>
    <Field label={editMode ? "Reemplazar documento, foto o video" : "Documento, fotografía o video"} hint={editMode ? "Opcional; si no eliges otro se conserva" : "Documentos, imágenes, MP4 o WEBM · máx. 512 MB"}><Input name="attachment" type="file" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,.mp4,.webm" /></Field>
    <Field label="Liga complementaria" hint="Opcional"><Input name="externalUrl" type="url" inputMode="url" maxLength={4000} defaultValue={material?.externalUrl ?? ""} placeholder="https://..." /></Field>
    {editMode && material?.externalUrl ? <label className="flex items-center gap-2 text-xs text-muted"><input name="removeExternalUrl" type="checkbox" className="size-4" />Quitar la liga complementaria guardada</label> : null}
  </>;
}

function ProtectedAudioButton({ href, allowed, onBlocked }: { href: string; allowed: boolean; onBlocked: () => void }) {
  const className = "inline-flex min-h-10 items-center gap-2 rounded-md bg-forest px-3 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5";
  if (!allowed) return <button type="button" onClick={onBlocked} className={className}><LockKeyhole className="size-3.5" />Abrir audio</button>;
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}><Headphones className="size-3.5" />Abrir audio</a>;
}

