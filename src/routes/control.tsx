import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useBoard, useRefreshBoard } from "@/components/board-context";
import { isModerator, useDirectory } from "@/components/directory";
import { PublishGate } from "@/components/publish-gate";
import { Shell } from "@/components/shell";
import { Button, Card, Field, FormBox, Input, Pill, Select } from "@/components/ui";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { loadMediaSettingsStatus, saveMediaSettings, type MediaSettingsStatus } from "@/lib/members";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  addCourse,
  addProfessor,
  removeBook,
  removeCourse,
  removeEvent,
  removeGroup,
  removeNotice,
  removeProfessor,
  removeRide,
} from "@/lib/content";

export const Route = createFileRoute("/control")({ component: ControlPage });

function normalizePersonName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function ControlPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-muted">
        <p>Comprobando acceso…</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <ControlBody />;
}

function ControlBody() {
  const board = useBoard();
  const refresh = useRefreshBoard();
  const { directory } = useDirectory();
  const mod = isModerator(directory);
  const [error, setError] = useState<string | null>(null);
  const [mediaStatus, setMediaStatus] = useState<MediaSettingsStatus | null>(null);
  const [mediaMessage, setMediaMessage] = useState<string | null>(null);
  const activeChairNames = new Set(board.professors.map((item) => normalizePersonName(item.fullTitle)));
  const availableCatedras = board.courses.filter((course) => !activeChairNames.has(normalizePersonName(course.chair)));

  useEffect(() => {
    if (!mod) return;
    void loadMediaSettingsStatus()
      .then(setMediaStatus)
      .catch(() => setMediaStatus(null));
  }, [mod]);

  async function onMediaSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMediaMessage(null);
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const secret = String(data.get("mediaSecret") ?? "").trim();
    const uploadUrl = String(data.get("mediaUploadUrl") ?? "").trim();
    try {
      await saveMediaSettings({ data: { secret, uploadUrl } });
      const status = await loadMediaSettingsStatus();
      setMediaStatus(status);
      setMediaMessage("Configuración guardada. Atrio ya puede firmar subidas aunque Vercel no entregue la variable al runtime.");
      form.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la configuración de archivos.");
    }
  }

  async function onCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await addCourse({
        data: {
          code: String(data.get("code") ?? ""),
          name: String(data.get("name") ?? ""),
          chair: String(data.get("chair") ?? ""),
          modality: String(data.get("modality") ?? "Presencial") as "Presencial",
          weekday: String(data.get("weekday") ?? "Lunes a viernes"),
          timeSlot: String(data.get("timeSlot") ?? ""),
          place: String(data.get("place") ?? ""),
          semester: String(data.get("semester") ?? "Primer semestre"),
          group: String(data.get("group") ?? "9114"),
        },
      });
      form.reset();
      await refresh();
    } catch {
      setError("No se pudo subir la clase. Hace falta cuenta de cátedra o moderación.");
    }
  }

  async function onChair(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await addProfessor({
        data: {
          fullTitle: String(data.get("fullTitle") ?? ""),
          area: String(data.get("area") ?? ""),
          office: String(data.get("office") ?? ""),
          hours: String(data.get("hours") ?? ""),
          modality: String(data.get("modality") ?? "Presencial") as "Presencial",
        },
      });
      form.reset();
      await refresh();
    } catch {
      setError("No se pudo subir la cátedra.");
    }
  }

  return (
    <Shell
      eyebrow="Panel del sitio"
      title="Sube el contenido y quita lo que ya no corre."
      lead="Las clases y cátedras las carga un profesor o un moderador. Lo demás se publica en cada área y queda guardado en el sitio."
    >
      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <PublishGate area="clases">
          <FormBox title="Subir una clase" onSubmit={onCourse}>
            <Field label="Clave">
              <Input name="code" required placeholder="1128" />
            </Field>
            <Field label="Asignatura">
              <Input name="name" required placeholder="Derecho romano II" />
            </Field>
            <Field label="Cátedra">
              <Input name="chair" required placeholder="Cátedra de Romano" />
            </Field>
            <Field label="Horario">
              <Input name="timeSlot" required placeholder="14:00–15:00" />
            </Field>
            <Field label="Salón">
              <Input name="place" required placeholder="D-106" />
            </Field>
            <Field label="Días">
              <Input name="weekday" defaultValue="Lunes a viernes" />
            </Field>
            <Field label="Grupo">
              <Input name="group" defaultValue="9114" />
            </Field>
            <Field label="Semestre">
              <Input name="semester" defaultValue="Primer semestre" />
            </Field>
            <Field label="Modalidad">
              <Select name="modality" defaultValue="Presencial">
                <option>Presencial</option>
                <option>En línea</option>
                <option>Híbrido</option>
              </Select>
            </Field>
            <Button type="submit">Guardar clase</Button>
          </FormBox>
        </PublishGate>

        <PublishGate area="catedras">
          <FormBox title="Subir una cátedra" onSubmit={onChair}>
            <Field label="Materia / docente">
              <Select name="fullTitle" required defaultValue="">
                <option value="" disabled>Selecciona una materia</option>
                {availableCatedras.map((course) => (
                  <option key={course.id} value={course.chair}>
                    {course.code} · {course.name} — {course.chair}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Área">
              <Input name="area" required placeholder="Histórico" />
            </Field>
            <Field label="Cubículo">
              <Input name="office" required placeholder="Edificio D · 12" />
            </Field>
            <Field label="Atención">
              <Input name="hours" required placeholder="Lun 14:15–15:15" />
            </Field>
            <Field label="Modalidad">
              <Select name="modality" defaultValue="Presencial">
                <option>Presencial</option>
                <option>En línea</option>
                <option>Híbrido</option>
              </Select>
            </Field>
            <Button type="submit">Guardar cátedra</Button>
          </FormBox>
        </PublishGate>
      </div>

      {mod ? (
        <Card className="mt-8">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">Almacenamiento de archivos</p>
              <h2 className="mt-1 font-display text-2xl">media.ge01.com</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Esta configuración funciona como respaldo server-side cuando Vercel no entrega ATRIO_MEDIA_UPLOAD_SECRET al runtime.
                El secreto nunca se muestra de vuelta en pantalla.
              </p>
            </div>
            <Pill tone={mediaStatus?.configured ? "forest" : "neutral"}>
              {mediaStatus?.configured ? `Configurado · ${mediaStatus.source === "vercel" ? "Vercel" : "Neon"}` : "Pendiente"}
            </Pill>
          </div>

          <form onSubmit={onMediaSettings} className="grid gap-4 md:grid-cols-2">
            <Field label="URL de subida">
              <Input
                name="mediaUploadUrl"
                type="url"
                required
                defaultValue={mediaStatus?.uploadUrl || "https://media.ge01.com/_upload/upload.php"}
              />
            </Field>
            <Field label="Secreto compartido" hint="Mínimo 32 caracteres · debe ser el mismo de HostGator">
              <Input name="mediaSecret" type="password" minLength={32} required placeholder="Pega aquí tu secreto de 64 caracteres" />
            </Field>
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <Button type="submit">Guardar configuración de archivos</Button>
              {mediaMessage ? <p className="text-sm text-forest">{mediaMessage}</p> : null}
            </div>
          </form>
        </Card>
      ) : null}

      <div className="mt-8 grid gap-4">
        <Inventory
          title="Horarios / materias"
          rows={board.courses.map((item) => ({ id: item.id, label: `${item.code} · ${item.name}`, meta: `${item.timeSlot} · ${item.place}` }))}
          onRemove={mod ? async (id) => { await removeCourse({ data: { id } }); await refresh(); } : undefined}
        />
        <Inventory
          title="Cátedras visibles"
          rows={board.professors.map((item) => {
            const course = board.courses.find((candidate) => normalizePersonName(candidate.chair) === normalizePersonName(item.fullTitle));
            return {
              id: item.id,
              label: course ? `${course.code} · ${course.name}` : item.fullTitle,
              meta: course ? `${item.fullTitle} · ${course.timeSlot} · ${course.place}` : `${item.fullTitle} · ${item.office}`,
            };
          })}
          onRemove={mod ? async (id) => { await removeProfessor({ data: { id } }); await refresh(); } : undefined}
        />
        <Inventory
          title="Agenda"
          rows={board.events.map((item) => ({ id: item.id, label: item.title, meta: item.eventDate }))}
          onRemove={mod ? async (id) => { await removeEvent({ data: { id } }); await refresh(); } : undefined}
        />
        <Inventory
          title="Libros"
          rows={board.books.map((item) => ({ id: item.id, label: item.title, meta: item.kind }))}
          onRemove={mod ? async (id) => { await removeBook({ data: { id } }); await refresh(); } : undefined}
        />
        <Inventory
          title="Rutas"
          rows={board.rides.map((item) => ({ id: item.id, label: `${item.fromPlace} → ${item.toPlace}`, meta: item.weekday }))}
          onRemove={mod ? async (id) => { await removeRide({ data: { id } }); await refresh(); } : undefined}
        />
        <Inventory
          title="Mesas"
          rows={board.groups.map((item) => ({ id: item.id, label: item.name, meta: item.course }))}
          onRemove={mod ? async (id) => { await removeGroup({ data: { id } }); await refresh(); } : undefined}
        />
        <Inventory
          title="Mural"
          rows={board.notices.map((item) => ({ id: item.id, label: item.title, meta: item.pinned ? "Fijo" : "Recado" }))}
          onRemove={mod ? async (id) => { await removeNotice({ data: { id } }); await refresh(); } : undefined}
        />
      </div>

      <p className="mt-6 rounded-lg border border-line bg-bg-warm/70 p-4 text-sm text-muted">
        <strong className="text-ink">Cómo funciona Cátedras:</strong> quitar una cátedra aquí sólo la oculta del directorio de Cátedras y de su expediente de clase; no borra la materia del horario. Para eliminar también el horario, quita la materia en “Horarios / materias”.
      </p>

      <p className="mt-6 text-sm text-muted">
        El padrón de alumnos y profesores está en{" "}
        <Link to="/registro" className="text-forest">
          Registro
        </Link>
        .
      </p>
    </Shell>
  );
}

function Inventory({
  title,
  rows,
  onRemove,
}: {
  title: string;
  rows: Array<{ id: number; label: string; meta: string }>;
  onRemove?: (id: number) => Promise<void>;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-display text-2xl">{title}</h2>
        <Pill>{rows.length}</Pill>
      </div>
      <ul className="grid gap-2">
        {rows.map((row) => (
          <li key={row.id} className="flex items-start justify-between gap-3 border-b border-line py-2 last:border-0">
            <div>
              <p className="font-medium">{row.label}</p>
              <p className="text-sm text-muted">{row.meta}</p>
            </div>
            {onRemove ? (
              <button
                type="button"
                className="shrink-0 text-xs text-danger underline"
                onClick={() => void onRemove(row.id)}
              >
                Quitar
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
