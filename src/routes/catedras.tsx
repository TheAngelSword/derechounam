import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpenCheck,
  CalendarDays,
  Camera,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Link2,
  MapPin,
  NotebookPen,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useRefreshBoard } from "@/components/board-context";
import { useAreaVisit } from "@/components/directory";
import { Button, Card, Field, FormBox, Input, Pill, Select, Textarea, cn } from "@/components/ui";
import { PublishGate } from "@/components/publish-gate";
import { addClassMaterial } from "@/lib/content";
import { uploadToAtrioMedia } from "@/lib/media-upload";
import { formatLongDate, getTodayIso } from "@/lib/format";
import type { ClassMaterial } from "@/lib/types";

export const Route = createFileRoute("/catedras")({ component: CatedrasPage });

const MATERIAL_KINDS = ["Apuntes", "Tarea", "Foto", "Material", "Aviso"] as const;
type MaterialKind = (typeof MATERIAL_KINDS)[number];


function normalizeUrl(value: string) {
  const trimmed = value.trim();
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

function CatedrasPage() {
  const { courses, materials } = useBoard();
  const refresh = useRefreshBoard();
  useAreaVisit("catedras");
  const ordered = [...courses].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  const [selectedCourse, setSelectedCourse] = useState<string>("Todos");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const visibleMaterials = useMemo(
    () => materials.filter((item) => selectedCourse === "Todos" || item.courseCode === selectedCourse),
    [materials, selectedCourse],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    setUploadProgress(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const courseCode = String(data.get("courseCode") ?? "");
    const course = ordered.find((item) => item.code === courseCode);
    const file = data.get("attachment");
    let fileUrl = "";
    let fileName = "";

    try {
      if (!course) throw new Error("Selecciona una materia válida.");

      if (file instanceof File && file.size > 0) {
        const allowed = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/jpeg",
          "image/png",
          "image/webp",
        ];
        if (!allowed.includes(file.type)) throw new Error("El archivo debe ser PDF, DOCX, JPG, PNG o WEBP.");
        if (file.size > 40 * 1024 * 1024) throw new Error("El archivo supera el límite de 40 MB.");
        const now = new Date();
        const stored = await uploadToAtrioMedia({
          file,
          category: "catedras",
          subfolder: `${course.code}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`,
          onProgress: setUploadProgress,
        });
        fileUrl = stored.url;
        fileName = file.name;
      }

      await addClassMaterial({
        data: {
          courseCode: course.code,
          courseName: course.name,
          classDate: String(data.get("classDate") ?? getTodayIso()),
          kind: String(data.get("kind") ?? "Apuntes") as MaterialKind,
          title: String(data.get("title") ?? "").trim(),
          body: String(data.get("body") ?? "").trim(),
          fileUrl,
          fileName,
          externalUrl: normalizeUrl(String(data.get("externalUrl") ?? "")),
        },
      });

      form.reset();
      setUploadProgress(null);
      setSuccess("Contenido agregado a la cátedra.");
      setSelectedCourse(course.code);
      await refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo publicar.";
      if (/ge01|servidor de archivos|autorizar|subida|media/i.test(message)) {
        setError(`No se pudo subir el archivo a ge01.com. ${message}`);
      } else if (/authorized|padrón|unauthorized/i.test(message)) {
        setError("Debes iniciar sesión y estar activo en el padrón para publicar.");
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      eyebrow="Cátedras · Grupo 9114"
      title="Las siete materias, sus docentes y lo visto en clase."
      lead="Cada cátedra funciona ahora como un expediente vivo: docente, horario y salón, más apuntes, tareas, fotos, archivos y materiales complementarios fechados por sesión."
    >
      <div className="stagger-children grid gap-4 md:grid-cols-2">
        {ordered.map((course) => {
          const count = materials.filter((item) => item.courseCode === course.code).length;
          const active = selectedCourse === course.code;
          return (
            <button
              key={course.id}
              type="button"
              onClick={() => setSelectedCourse(active ? "Todos" : course.code)}
              className="text-left"
            >
              <Card
                interactive
                className={cn(
                  "motion-sheen group soft-raise min-h-full transition-all duration-250",
                  active && "border-forest/35 bg-forest-soft shadow-float",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Pill tone="forest">{course.code}</Pill>
                  <span className="text-xs font-medium text-muted">{course.semester}</span>
                </div>
                <h2 className="mt-3 font-display text-2xl leading-tight">{course.name}</h2>
                <p className="mt-3 inline-flex items-start gap-2 text-sm font-semibold text-forest">
                  <UserRound className="mt-0.5 size-4 shrink-0 transition-transform duration-250 group-hover:scale-110" />
                  {course.chair}
                </p>
                <div className="mt-5 grid gap-2 border-t border-line pt-4 text-sm text-ink-soft sm:grid-cols-2">
                  <span className="inline-flex items-center gap-2"><Clock3 className="size-4 text-muted" />{course.timeSlot}</span>
                  <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-muted" />{course.place}</span>
                  <span className="inline-flex items-center gap-2 sm:col-span-2"><GraduationCap className="size-4 text-muted" />{course.weekday} · Grupo {course.group}</span>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg bg-bg-warm/70 px-3 py-2 text-xs">
                  <span className="font-medium text-ink-soft">Contenido guardado</span>
                  <span className="rounded-full bg-white px-2.5 py-1 font-bold text-forest shadow-sm">{count}</span>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">Expediente de clase</p>
            <h2 className="mt-1 font-display text-3xl">Apuntes, tareas y materiales</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCourse("Todos")}
              className={cn("rounded-full px-3 py-2 text-xs font-semibold transition-all", selectedCourse === "Todos" ? "bg-forest text-bg" : "border border-line bg-surface text-muted")}
            >
              Todas
            </button>
            {ordered.map((course) => (
              <button
                key={course.code}
                type="button"
                onClick={() => setSelectedCourse(course.code)}
                className={cn("rounded-full px-3 py-2 text-xs font-semibold transition-all", selectedCourse === course.code ? "bg-forest text-bg" : "border border-line bg-surface text-muted hover:-translate-y-0.5")}
              >
                {course.code}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
          <div className="stagger-children grid content-start gap-4 md:grid-cols-2">
            {visibleMaterials.map((material) => {
              const Icon = kindIcon(material.kind);
              return (
                <Card key={material.id} interactive className="group soft-raise overflow-hidden p-0">
                  {isImageFile(material) ? (
                    <div className="h-48 overflow-hidden bg-bg-warm">
                      <img src={material.fileUrl ?? ""} alt={material.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                    </div>
                  ) : null}
                  <div className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Pill tone={material.kind === "Tarea" ? "clay" : "forest"}>{material.kind}</Pill>
                        <Pill>{material.courseCode}</Pill>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-muted"><CalendarDays className="size-3.5" />{formatLongDate(material.classDate)}</span>
                    </div>
                    <div className="mt-4 flex items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-forest-soft text-forest"><Icon className="size-4" /></span>
                      <div>
                        <h3 className="font-display text-xl leading-tight">{material.title}</h3>
                        <p className="mt-1 text-xs font-medium text-forest">{material.courseName}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{material.body}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {material.fileUrl ? (
                        <a href={material.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-forest px-3 py-2 text-xs font-semibold text-bg transition-transform hover:-translate-y-0.5">
                          {isImageFile(material) ? <ImageIcon className="size-3.5" /> : <FileText className="size-3.5" />}
                          {material.fileName || "Abrir archivo"}
                        </a>
                      ) : null}
                      {material.externalUrl ? (
                        <a href={material.externalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold text-forest hover:border-forest/30">
                          <ExternalLink className="size-3.5" /> Liga complementaria
                        </a>
                      ) : null}
                    </div>
                    <p className="mt-4 text-xs text-muted">Publicado por {material.authorAlias}</p>
                  </div>
                </Card>
              );
            })}
            {!visibleMaterials.length ? <Card><p className="text-sm text-muted">Todavía no hay contenido para esta cátedra.</p></Card> : null}
          </div>

          <PublishGate area="catedras">
            <FormBox title="Agregar contenido de clase" onSubmit={onSubmit}>
              <Field label="Materia">
                <Select name="courseCode" required defaultValue={selectedCourse !== "Todos" ? selectedCourse : ordered[0]?.code}>
                  {ordered.map((course) => <option key={course.code} value={course.code}>{course.code} · {course.name}</option>)}
                </Select>
              </Field>
              <Field label="Fecha de la clase">
                <Input name="classDate" type="date" required defaultValue={getTodayIso()} />
              </Field>
              <Field label="Tipo de contenido">
                <Select name="kind" defaultValue="Apuntes">
                  {MATERIAL_KINDS.map((kind) => <option key={kind}>{kind}</option>)}
                </Select>
              </Field>
              <Field label="Título">
                <Input name="title" required placeholder="Tema visto / tarea / material" />
              </Field>
              <Field label="Descripción o apuntes">
                <Textarea name="body" required placeholder="Resumen de lo visto, indicaciones, tarea o información complementaria." />
              </Field>
              <Field label="Archivo o foto" hint="Opcional · PDF, DOCX, JPG, PNG, WEBP">
                <Input name="attachment" type="file" accept="application/pdf,.docx,image/jpeg,image/png,image/webp" />
              </Field>
              <Field label="Liga complementaria" hint="Opcional">
                <Input name="externalUrl" placeholder="https://..." />
              </Field>
              {uploadProgress !== null ? <p className="text-sm text-muted">Subiendo archivo: {uploadProgress}%</p> : null}
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              {success ? <p className="text-sm text-forest">{success}</p> : null}
              <Button type="submit" disabled={busy} className="gap-2"><UploadCloud className="size-4" />{busy ? "Guardando…" : "Guardar en la cátedra"}</Button>
            </FormBox>
          </PublishGate>
        </div>
      </section>
    </Shell>
  );
}
