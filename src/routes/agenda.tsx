import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Pencil, UsersRound, Vote, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useBoardStatus, useRefreshBoard } from "@/components/board-context";
import { Button, Card, Field, FormBox, Input, Pill, Select, Textarea } from "@/components/ui";
import { PublishGate } from "@/components/publish-gate";
import { canEditPublication, useAreaVisit, useDirectory } from "@/components/directory";
import { addEvent, loadBoard, updateEvent } from "@/lib/content";
import { createPoll, loadPolls } from "@/lib/votaciones";
import { formatLongDate, getTodayIso } from "@/lib/format";
import type { EventItem } from "@/lib/types";

export const Route = createFileRoute("/agenda")({ component: AgendaPage });

const KINDS = ["Todas", "Taller", "Conferencia", "Actividad", "Clínica", "Social"] as const;
type AgendaKind = Exclude<(typeof KINDS)[number], "Todas">;

const DEFAULT_POLL_PROMPT = "¿Qué día y hora puedes asistir?";

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

type EventFormDraft = {
  event: EventDraft;
  voting: {
    enabled: boolean;
    prompt: string;
    description: string;
  };
};

function readEventForm(data: FormData): EventFormDraft {
  const title = String(data.get("title") ?? "").trim();
  const eventDate = String(data.get("eventDate") ?? "").trim();
  const timeSlot = String(data.get("timeSlot") ?? "").trim();
  if (title.length < 2) throw new Error("Escribe un título para la actividad.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) throw new Error("Selecciona una fecha válida.");
  if (timeSlot.length < 4) throw new Error("Indica el horario de la actividad.");

  return {
    event: {
      title,
      kind: String(data.get("kind") ?? "Taller") as AgendaKind,
      eventDate,
      timeSlot,
      place: String(data.get("place") ?? "").trim() || "Por definir",
      modality: String(data.get("modality") ?? "Presencial") as EventDraft["modality"],
      description: String(data.get("description") ?? "").trim() || "Sin nota adicional.",
      hostAlias: String(data.get("hostAlias") ?? "").trim() || "Grupo 9114",
    },
    voting: {
      enabled: data.get("enableVoting") === "on",
      prompt: String(data.get("pollPrompt") ?? "").trim() || DEFAULT_POLL_PROMPT,
      description: String(data.get("pollDescription") ?? "").trim(),
    },
  };
}

function AgendaPage() {
  const { events } = useBoard();
  const boardStatus = useBoardStatus();
  const refresh = useRefreshBoard();
  const { user, directory } = useDirectory();
  useAreaVisit("agenda");

  const pollsQuery = useQuery({ queryKey: ["activity-polls"], queryFn: () => loadPolls(), staleTime: 5_000, retry: false });
  const polls = pollsQuery.data ?? [];
  const pollsByEvent = useMemo(() => new Map(polls.filter((poll) => poll.eventId).map((poll) => [poll.eventId as number, poll])), [polls]);

  const [filter, setFilter] = useState<(typeof KINDS)[number]>("Todas");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [busy, setBusy] = useState(false);

  const visible = useMemo(
    () => events.filter((event) => filter === "Todas" || event.kind === filter),
    [events, filter],
  );

  async function createLinkedPoll(eventId: number, draft: EventFormDraft) {
    await createPoll({ data: {
      eventId,
      title: draft.event.title,
      prompt: draft.voting.prompt,
      description: draft.voting.description || draft.event.description,
    } });
    await pollsQuery.refetch();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const draft = readEventForm(new FormData(form));
      await addEvent({ data: draft.event });

      let pollWarning = "";
      if (draft.voting.enabled) {
        try {
          const fresh = await loadBoard();
          const created = [...fresh.events]
            .filter((item) =>
              item.title === draft.event.title &&
              item.eventDate === draft.event.eventDate &&
              item.timeSlot === draft.event.timeSlot &&
              (!user?.id || item.createdBy === user.id),
            )
            .sort((a, b) => b.id - a.id)[0];
          if (!created) throw new Error("No se encontró la actividad recién creada.");
          await createLinkedPoll(created.id, draft);
        } catch (cause) {
          pollWarning = cause instanceof Error ? cause.message : "No se pudo crear la votación.";
        }
      }

      form.reset();
      await refresh();
      setSuccess(pollWarning
        ? `La actividad se publicó, pero la votación no pudo abrirse: ${pollWarning}`
        : draft.voting.enabled
          ? "Actividad publicada con votación abierta."
          : "Actividad publicada en la agenda.");
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
      const draft = readEventForm(new FormData(event.currentTarget));
      await updateEvent({ data: { id: editing.id, ...draft.event } });
      const currentPoll = pollsByEvent.get(editing.id);
      if (draft.voting.enabled && !currentPoll) await createLinkedPoll(editing.id, draft);
      await refresh();
      setEditing(null);
      setSuccess(draft.voting.enabled && !currentPoll ? "Actividad actualizada y votación creada." : "Actividad actualizada correctamente.");
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
      lead="Talleres, conferencias, actividades, clínicas y encuentros del grupo en un solo calendario. También puedes abrir una votación para coordinar el mejor día y horario."
    >
      {boardStatus.isError ? (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-danger/25 bg-red-50 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p><strong>No se pudo sincronizar con la base de datos.</strong> El portal está mostrando datos de respaldo; una edición puede guardarse pero no verse reflejada hasta corregir las migraciones.</p>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
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
        <Link to="/votaciones" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-forest/20 bg-forest-soft px-4 text-sm font-semibold text-forest-deep">
          <Vote className="size-4" />Votaciones
        </Link>
      </div>

      {success ? <p className="mb-4 rounded-lg bg-forest-soft px-4 py-3 text-sm font-medium text-forest-deep">{success}</p> : null}
      {pollsQuery.isError ? <p className="mb-4 rounded-lg border border-clay/20 bg-clay/10 px-4 py-3 text-sm text-muted">Las actividades funcionan, pero Votaciones todavía no está disponible. Verifica que se haya aplicado la migración 0015.</p> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid content-start gap-4 lg:col-span-2">
          {visible.map((item) => {
            const editable = canEditPublication(directory, user?.id, item.createdBy);
            const poll = pollsByEvent.get(item.id);
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
                {poll ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-forest/10 bg-forest-soft px-4 py-3">
                    <div>
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-forest-deep"><UsersRound className="size-4" />{poll.responses.length} persona{poll.responses.length === 1 ? "" : "s"} registrada{poll.responses.length === 1 ? "" : "s"}</p>
                      <p className="mt-1 text-xs text-muted">{poll.isOpen ? "Votación abierta" : "Votación cerrada"} · {poll.prompt}</p>
                    </div>
                    <Link to="/votaciones" className="rounded-md bg-forest px-3 py-2 text-xs font-semibold text-white">Ver votación</Link>
                  </div>
                ) : null}
              </Card>
            );
          })}
          {!visible.length ? <Card><p className="text-sm text-muted">No hay actividades en esta categoría.</p></Card> : null}
        </div>

        <div id="agenda-form" className="scroll-mt-6">
          {editing ? (
            <FormBox key={`edit-${editing.id}`} title="Editar actividad" onSubmit={onEdit} noValidate>
              <Cancel onClick={() => { setEditing(null); setError(null); }} />
              <EventFields item={editing} hasPoll={Boolean(pollsByEvent.get(editing.id))} />
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

function EventFields({ item, hasPoll = false }: { item?: EventItem; hasPoll?: boolean }) {
  return (
    <>
      <Field label="Título"><Input name="title" maxLength={80} defaultValue={item?.title ?? ""} placeholder="Taller de alegatos" /></Field>
      <Field label="Tipo"><Select name="kind" defaultValue={item?.kind ?? "Taller"}><option>Taller</option><option>Conferencia</option><option>Actividad</option><option>Clínica</option><option>Social</option></Select></Field>
      <Field label="Fecha" hint="Puede ser una fecha tentativa si abrirás votación"><Input name="eventDate" type="date" defaultValue={item?.eventDate ?? getTodayIso()} /></Field>
      <Field label="Horario"><Input name="timeSlot" maxLength={24} defaultValue={item?.timeSlot ?? ""} placeholder="17:00–19:00" /></Field>
      <Field label="Lugar" hint="Opcional"><Input name="place" defaultValue={item?.place ?? ""} placeholder="Sala 2 o aula virtual" /></Field>
      <Field label="Modalidad"><Select name="modality" defaultValue={item?.modality ?? "Presencial"}><option>Presencial</option><option>En línea</option><option>Híbrido</option></Select></Field>
      <Field label="Nota" hint="Opcional"><Textarea name="description" maxLength={240} defaultValue={item?.description === "Sin nota adicional." ? "" : item?.description ?? ""} placeholder="Qué llevar, cupo o indicaciones" /></Field>
      <Field label="Organiza / responsable" hint="Opcional"><Input name="hostAlias" maxLength={40} defaultValue={item?.hostAlias === "Grupo 9114" ? "" : item?.hostAlias ?? ""} placeholder="Grupo 9114" /></Field>

      {hasPoll ? (
        <div className="rounded-xl border border-forest/10 bg-forest-soft p-4">
          <p className="inline-flex items-center gap-2 font-semibold text-forest-deep"><Vote className="size-4" />Esta actividad ya tiene una votación.</p>
          <p className="mt-1 text-xs text-muted">La lista de asistentes, días, horarios y estado de la votación se administran en Votaciones.</p>
          <Link to="/votaciones" className="mt-3 inline-flex text-sm font-semibold text-forest">Abrir Votaciones →</Link>
        </div>
      ) : (
        <div className="rounded-xl border border-clay/15 bg-clay/5 p-4">
          <label className="flex items-start gap-3">
            <input name="enableVoting" type="checkbox" className="mt-1 size-4 shrink-0" />
            <span>
              <strong className="block text-sm text-ink">Abrir votación / registro de disponibilidad</strong>
              <span className="mt-1 block text-xs leading-relaxed text-muted">Los compañeros podrán participar sin registrarse: sólo escriben su nombre, día y hora disponibles.</span>
            </span>
          </label>
          <div className="mt-4 grid gap-3">
            <Field label="Pregunta para la votación"><Input name="pollPrompt" maxLength={300} defaultValue={DEFAULT_POLL_PROMPT} /></Field>
            <Field label="Indicaciones para la votación" hint="Opcional"><Textarea name="pollDescription" maxLength={1200} placeholder="Ej. Curso de 3 horas; elige el día y hora que te funcionen mejor." /></Field>
          </div>
        </div>
      )}
    </>
  );
}
