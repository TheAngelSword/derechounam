import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Pencil, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useBoardStatus, useRefreshBoard } from "@/components/board-context";
import { Button, Card, Field, FormBox, Input, Pill, Select, Textarea } from "@/components/ui";
import { PublishGate } from "@/components/publish-gate";
import { canEditPublication, useAreaVisit, useDirectory } from "@/components/directory";
import { addEvent, updateEvent } from "@/lib/content";
import { formatLongDate, getTodayIso } from "@/lib/format";
import type { EventItem } from "@/lib/types";

export const Route = createFileRoute("/agenda")({ component: AgendaPage });

const KINDS = ["Todas", "Taller", "Conferencia", "Actividad", "Clínica", "Social"] as const;
type AgendaKind = Exclude<(typeof KINDS)[number], "Todas">;

type EventDraft = {
  title: string;
  kind: AgendaKind;
  eventDate: string;
  timeSlot: string;
  place: string;
  modality: "Presencial" | "En línea" | "Híbrido";
  description: string;
  hostAlias: string;
};

function readEventForm(data: FormData): EventDraft {
  const title = String(data.get("title") ?? "").trim();
  const eventDate = String(data.get("eventDate") ?? "").trim();
  const timeSlot = String(data.get("timeSlot") ?? "").trim();
  if (title.length < 2) throw new Error("Escribe un título para la actividad.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) throw new Error("Selecciona una fecha válida.");
  if (timeSlot.length < 4) throw new Error("Indica el horario de la actividad.");

  return {
    title,
    kind: String(data.get("kind") ?? "Taller") as AgendaKind,
    eventDate,
    timeSlot,
    place: String(data.get("place") ?? "").trim() || "Por definir",
    modality: String(data.get("modality") ?? "Presencial") as EventDraft["modality"],
    description: String(data.get("description") ?? "").trim() || "Sin nota adicional.",
    hostAlias: String(data.get("hostAlias") ?? "").trim() || "Grupo 9114",
  };
}

function AgendaPage() {
  const { events } = useBoard();
  const boardStatus = useBoardStatus();
  const refresh = useRefreshBoard();
  const { user, directory } = useDirectory();
  useAreaVisit("agenda");

  const [filter, setFilter] = useState<(typeof KINDS)[number]>("Todas");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [busy, setBusy] = useState(false);

  const visible = useMemo(
    () => events.filter((event) => filter === "Todas" || event.kind === filter),
    [events, filter],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const data = readEventForm(new FormData(form));
      await addEvent({ data });
      form.reset();
      await refresh();
      setSuccess("Actividad publicada en la agenda.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo publicar la actividad.");
    } finally {
      setBusy(false);
    }
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const data = readEventForm(new FormData(event.currentTarget));
      await updateEvent({ data: { id: editing.id, ...data } });
      await refresh();
      setEditing(null);
      setSuccess("Actividad actualizada correctamente.");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo guardar la actividad.";
      setError(
        /autor de la publicación|administrador/i.test(message)
          ? "Sólo el autor o un administrador puede editar esta actividad."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }

  function startEdit(item: EventItem) {
    setEditing(item);
    setError(null);
    setSuccess(null);
    requestAnimationFrame(() => document.getElementById("agenda-form")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <Shell
      eyebrow="Agenda · Grupo 9114"
      title="Actividades del grupo 9114"
      lead="Talleres, conferencias, actividades, clínicas y encuentros del grupo en un solo calendario."
    >
      {boardStatus.isError ? (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-danger/25 bg-red-50 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p><strong>No se pudo sincronizar con la base de datos.</strong> El portal está mostrando datos de respaldo; una edición puede guardarse pero no verse reflejada hasta corregir las migraciones.</p>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        {KINDS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            aria-pressed={filter === item}
            className={filter === item ? "min-h-11 rounded-full bg-forest px-4 text-sm text-bg" : "min-h-11 rounded-full border border-line bg-surface px-4 text-sm text-ink-soft"}
          >
            {item}
          </button>
        ))}
      </div>

      {success ? <p className="mb-4 rounded-lg bg-forest-soft px-4 py-3 text-sm font-medium text-forest-deep">{success}</p> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-4 lg:col-span-2">
          {visible.map((item) => {
            const editable = canEditPublication(directory, user?.id, item.createdBy);
            return (
              <Card key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill>{item.kind}</Pill>
                    <Pill>{item.modality}</Pill>
                    <span className="text-xs tabular-nums text-muted">{formatLongDate(item.eventDate)}</span>
                  </div>
                  {editable ? (
                    <button type="button" onClick={() => startEdit(item)} className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-forest">
                      <Pencil className="size-3.5" />Editar
                    </button>
                  ) : null}
                </div>
                <h2 className="mt-3 font-display text-2xl">{item.title}</h2>
                <p className="mt-2 text-sm text-muted">{item.description}</p>
                <p className="mt-3 text-sm">{item.timeSlot} · {item.place} · {item.hostAlias}</p>
              </Card>
            );
          })}
          {!visible.length ? <Card><p className="text-sm text-muted">No hay actividades en esta categoría.</p></Card> : null}
        </div>

        <div id="agenda-form" className="scroll-mt-6">
          {editing ? (
            <FormBox key={`edit-${editing.id}`} title="Editar actividad" onSubmit={onEdit} noValidate>
              <Cancel onClick={() => { setEditing(null); setError(null); }} />
              <EventFields item={editing} />
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <Button type="submit" disabled={busy}><Pencil className="mr-2 size-4" />{busy ? "Guardando…" : "Guardar cambios"}</Button>
            </FormBox>
          ) : (
            <PublishGate area="agenda">
              <FormBox title="Publicar en la agenda" onSubmit={onSubmit} noValidate>
                <EventFields />
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                <Button type="submit" disabled={busy}>{busy ? "Publicando…" : "Publicar"}</Button>
              </FormBox>
            </PublishGate>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Cancel({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-xs font-semibold text-forest">
        <X className="size-3.5" />Cancelar
      </button>
    </div>
  );
}

function EventFields({ item }: { item?: EventItem }) {
  return (
    <>
      <Field label="Título"><Input name="title" maxLength={80} defaultValue={item?.title ?? ""} placeholder="Taller de alegatos" /></Field>
      <Field label="Tipo"><Select name="kind" defaultValue={item?.kind ?? "Taller"}><option>Taller</option><option>Conferencia</option><option>Actividad</option><option>Clínica</option><option>Social</option></Select></Field>
      <Field label="Fecha"><Input name="eventDate" type="date" defaultValue={item?.eventDate ?? getTodayIso()} /></Field>
      <Field label="Horario"><Input name="timeSlot" maxLength={24} defaultValue={item?.timeSlot ?? ""} placeholder="17:00–19:00" /></Field>
      <Field label="Lugar" hint="Opcional"><Input name="place" defaultValue={item?.place ?? ""} placeholder="Sala 2 o aula virtual" /></Field>
      <Field label="Modalidad"><Select name="modality" defaultValue={item?.modality ?? "Presencial"}><option>Presencial</option><option>En línea</option><option>Híbrido</option></Select></Field>
      <Field label="Nota" hint="Opcional"><Textarea name="description" maxLength={240} defaultValue={item?.description === "Sin nota adicional." ? "" : item?.description ?? ""} placeholder="Qué llevar, cupo o indicaciones" /></Field>
      <Field label="Organiza / responsable" hint="Opcional"><Input name="hostAlias" maxLength={40} defaultValue={item?.hostAlias === "Grupo 9114" ? "" : item?.hostAlias ?? ""} placeholder="Grupo 9114" /></Field>
    </>
  );
}
