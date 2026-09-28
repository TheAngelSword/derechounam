import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pencil,
  Trash2,
  UserRound,
  UsersRound,
  Vote,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { Button, Card, Field, FormBox, Input, Pill, Textarea } from "@/components/ui";
import { canEditPublication, isModerator, useDirectory } from "@/components/directory";
import { formatLongDate, getTodayIso } from "@/lib/format";
import {
  createPoll,
  loadPolls,
  removePoll,
  removeVoteResponse,
  savePublicVote,
  updatePoll,
  updateVoteResponse,
  type ActivityPoll,
  type VoteResponse,
} from "@/lib/votaciones";

export const Route = createFileRoute("/votaciones")({ component: VotacionesPage });

const DEFAULT_PROMPT = "¿Qué día y hora puedes asistir?";

function VotacionesPage() {
  const { user, directory } = useDirectory();
  const admin = isModerator(directory);
  const pollsQuery = useQuery({
    queryKey: ["activity-polls"],
    queryFn: () => loadPolls(),
    staleTime: 5_000,
  });
  const polls = pollsQuery.data ?? [];
  const [editingPollId, setEditingPollId] = useState<number | null>(null);
  const [editingResponseId, setEditingResponseId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);

  async function refresh() {
    await pollsQuery.refetch();
  }

  async function onCreateStandalone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setPageError(null); setPageSuccess(null);
    try {
      await createPoll({ data: {
        title: String(data.get("title") ?? "").trim(),
        prompt: String(data.get("prompt") ?? DEFAULT_PROMPT).trim(),
        description: String(data.get("description") ?? "").trim(),
      } });
      form.reset();
      setPageSuccess("Votación creada correctamente.");
      await refresh();
    } catch (cause) {
      setPageError(cause instanceof Error ? cause.message : "No se pudo crear la votación.");
    } finally { setBusy(false); }
  }

  async function onUpdatePoll(event: FormEvent<HTMLFormElement>, poll: ActivityPoll) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setPageError(null); setPageSuccess(null);
    try {
      await updatePoll({ data: {
        id: poll.id,
        title: String(data.get("title") ?? "").trim(),
        prompt: String(data.get("prompt") ?? DEFAULT_PROMPT).trim(),
        description: String(data.get("description") ?? "").trim(),
        isOpen: data.get("isOpen") === "on",
      } });
      setEditingPollId(null);
      setPageSuccess("Votación actualizada.");
      await refresh();
    } catch (cause) {
      setPageError(cause instanceof Error ? cause.message : "No se pudo actualizar la votación.");
    } finally { setBusy(false); }
  }

  async function onRemovePoll(poll: ActivityPoll) {
    if (!window.confirm(`¿Eliminar la votación “${poll.title}” y todas sus respuestas?`)) return;
    setBusy(true); setPageError(null); setPageSuccess(null);
    try {
      await removePoll({ data: { id: poll.id } });
      setPageSuccess("Votación eliminada.");
      await refresh();
    } catch (cause) {
      setPageError(cause instanceof Error ? cause.message : "No se pudo eliminar la votación.");
    } finally { setBusy(false); }
  }

  return (
    <Shell
      eyebrow="Votaciones · Grupo 9114"
      title="Votaciones y disponibilidad del grupo."
      lead="Apúntate a cursos, actividades y encuentros indicando tu nombre, el día y la hora en que puedes asistir. Para participar no necesitas una cuenta."
    >
      <Card className="unam-hero-card hero-glow mb-7">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-bg/60">Participación abierta</p>
            <h2 className="mt-2 font-display text-3xl">Sólo escribe tu nombre, día y hora.</h2>
            <p className="mt-2 max-w-2xl text-sm text-bg/75">
              No es necesario registrarse en el portal para participar. Si vuelves a guardar usando el mismo nombre en la misma votación, se actualiza tu disponibilidad.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.07] px-5 py-4 text-center">
            <p className="font-display text-4xl leading-none">{polls.reduce((sum, poll) => sum + poll.responses.length, 0)}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-bg/60">participaciones</p>
          </div>
        </div>
      </Card>

      {pageError ? <p className="mb-4 rounded-lg border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger">{pageError}</p> : null}
      {pageSuccess ? <p className="mb-4 rounded-lg bg-forest-soft px-4 py-3 text-sm font-medium text-forest-deep">{pageSuccess}</p> : null}

      {admin ? (
        <div className="mb-7">
          <FormBox title="Nueva votación independiente" onSubmit={onCreateStandalone}>
            <p className="text-sm text-muted">También puedes crear votaciones ligadas automáticamente a una actividad desde Agenda.</p>
            <Field label="Título"><Input name="title" required maxLength={180} placeholder="Curso de argumentación jurídica" /></Field>
            <Field label="Pregunta"><Input name="prompt" required maxLength={300} defaultValue={DEFAULT_PROMPT} /></Field>
            <Field label="Descripción" hint="Opcional"><Textarea name="description" maxLength={1200} placeholder="Información del curso, condiciones o indicaciones." /></Field>
            <Button type="submit" disabled={busy}><Vote className="mr-2 size-4" />Crear votación</Button>
          </FormBox>
        </div>
      ) : null}

      {pollsQuery.isPending ? <Card><p className="text-sm text-muted">Cargando votaciones…</p></Card> : null}
      {pollsQuery.isError ? <Card><p className="text-sm text-danger">No se pudieron cargar las votaciones. Revisa que la migración 0015 se haya aplicado en Neon.</p></Card> : null}

      <div className="grid gap-6">
        {polls.map((poll) => {
          const canEditPoll = canEditPublication(directory, user?.id, poll.createdBy);
          return (
            <PollCard
              key={poll.id}
              poll={poll}
              canEditPoll={canEditPoll}
              admin={admin}
              editing={editingPollId === poll.id}
              busy={busy}
              editingResponseId={editingResponseId}
              onStartEdit={() => setEditingPollId(poll.id)}
              onCancelEdit={() => setEditingPollId(null)}
              onUpdatePoll={(event) => onUpdatePoll(event, poll)}
              onRemovePoll={() => onRemovePoll(poll)}
              onRefresh={refresh}
              onBusy={setBusy}
              onError={setPageError}
              onSuccess={setPageSuccess}
              onEditResponse={setEditingResponseId}
            />
          );
        })}
        {!pollsQuery.isPending && !polls.length ? (
          <Card>
            <p className="font-display text-2xl">Todavía no hay votaciones.</p>
            <p className="mt-2 text-sm text-muted">Cuando una actividad de Agenda abra una votación aparecerá aquí.</p>
            <Link to="/agenda" className="mt-4 inline-flex text-sm font-semibold text-forest">Ver actividades</Link>
          </Card>
        ) : null}
      </div>
    </Shell>
  );
}

function PollCard({
  poll,
  canEditPoll,
  admin,
  editing,
  busy,
  editingResponseId,
  onStartEdit,
  onCancelEdit,
  onUpdatePoll,
  onRemovePoll,
  onRefresh,
  onBusy,
  onError,
  onSuccess,
  onEditResponse,
}: {
  poll: ActivityPoll;
  canEditPoll: boolean;
  admin: boolean;
  editing: boolean;
  busy: boolean;
  editingResponseId: number | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdatePoll: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onRemovePoll: () => void;
  onRefresh: () => Promise<void>;
  onBusy: (value: boolean) => void;
  onError: (value: string | null) => void;
  onSuccess: (value: string | null) => void;
  onEditResponse: (id: number | null) => void;
}) {
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const slots = useMemo(() => summarizeSlots(poll.responses), [poll.responses]);

  async function onVote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    onBusy(true); onError(null); onSuccess(null); setLocalMessage(null);
    try {
      await savePublicVote({ data: {
        pollId: poll.id,
        participantName: String(data.get("participantName") ?? "").trim(),
        availableDate: String(data.get("availableDate") ?? ""),
        availableTime: String(data.get("availableTime") ?? ""),
        note: String(data.get("note") ?? "").trim(),
        website: String(data.get("website") ?? ""),
      } });
      setLocalMessage("Tu disponibilidad quedó guardada.");
      await onRefresh();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "No se pudo guardar tu disponibilidad.");
    } finally { onBusy(false); }
  }

  async function onUpdateResponse(event: FormEvent<HTMLFormElement>, response: VoteResponse) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onBusy(true); onError(null); onSuccess(null);
    try {
      await updateVoteResponse({ data: {
        id: response.id,
        participantName: String(data.get("participantName") ?? "").trim(),
        availableDate: String(data.get("availableDate") ?? ""),
        availableTime: String(data.get("availableTime") ?? ""),
        note: String(data.get("note") ?? "").trim(),
      } });
      onEditResponse(null);
      onSuccess("Participación actualizada.");
      await onRefresh();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "No se pudo editar la participación.");
    } finally { onBusy(false); }
  }

  async function onRemoveResponse(response: VoteResponse) {
    if (!window.confirm(`¿Quitar a ${response.participantName} de esta votación?`)) return;
    onBusy(true); onError(null); onSuccess(null);
    try {
      await removeVoteResponse({ data: { id: response.id } });
      onSuccess("Participación eliminada.");
      await onRefresh();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "No se pudo eliminar la participación.");
    } finally { onBusy(false); }
  }

  return (
    <Card id={`votacion-${poll.id}`} className="overflow-hidden p-0">
      <div className="border-b border-line p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={poll.isOpen ? "forest" : "neutral"}>{poll.isOpen ? "Abierta" : "Cerrada"}</Pill>
              <Pill><UsersRound className="mr-1 size-3" />{poll.responses.length} personas</Pill>
            </div>
            <h2 className="mt-3 font-display text-3xl">{poll.title}</h2>
            <p className="mt-2 font-medium text-forest">{poll.prompt}</p>
            {poll.description ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{poll.description}</p> : null}
            {poll.eventTitle ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" />{poll.eventDate ? formatLongDate(poll.eventDate) : "Actividad"}</span>
                {poll.eventTime ? <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{poll.eventTime}</span> : null}
                {poll.eventPlace ? <span>{poll.eventPlace}</span> : null}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {canEditPoll ? <button type="button" onClick={onStartEdit} className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-line bg-white px-3 text-xs font-semibold text-forest"><Pencil className="size-3.5" />Editar</button> : null}
            {admin ? <button type="button" onClick={onRemovePoll} className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-danger/20 bg-red-50 px-3 text-xs font-semibold text-danger"><Trash2 className="size-3.5" />Eliminar</button> : null}
          </div>
        </div>

        {editing ? (
          <form onSubmit={onUpdatePoll} className="mt-5 grid gap-3 rounded-xl border border-line bg-bg-warm/60 p-4">
            <div className="flex items-center justify-between"><p className="font-semibold">Editar votación</p><button type="button" onClick={onCancelEdit} className="inline-flex items-center gap-1 text-xs font-semibold text-forest"><X className="size-3.5" />Cancelar</button></div>
            <Field label="Título"><Input name="title" required maxLength={180} defaultValue={poll.title} /></Field>
            <Field label="Pregunta"><Input name="prompt" required maxLength={300} defaultValue={poll.prompt} /></Field>
            <Field label="Descripción" hint="Opcional"><Textarea name="description" maxLength={1200} defaultValue={poll.description} /></Field>
            <label className="flex items-center gap-2 text-sm font-medium"><input name="isOpen" type="checkbox" defaultChecked={poll.isOpen} className="size-4" />Aceptar nuevas participaciones</label>
            <Button type="submit" disabled={busy}>Guardar cambios</Button>
          </form>
        ) : null}
      </div>

      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(19rem,.8fr)_minmax(0,1.2fr)]">
        <div>
          <h3 className="font-display text-2xl">Disponibilidad</h3>
          {slots.length ? (
            <div className="mt-3 grid gap-2">
              {slots.slice(0, 6).map((slot, index) => (
                <div key={slot.key} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-warm/55 px-3 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-clay">{index === 0 ? "Mayor coincidencia" : "Opción"}</p>
                    <p className="mt-1 font-semibold">{formatLongDate(slot.date)} · {slot.time}</p>
                  </div>
                  <span className="grid min-w-10 place-items-center rounded-full bg-forest px-3 py-2 text-sm font-bold text-white">{slot.count}</span>
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-sm text-muted">Todavía no hay personas registradas.</p>}

          <div className="mt-5">
            <h3 className="font-display text-xl">Personas registradas</h3>
            <div className="mt-3 grid gap-2">
              {poll.responses.map((response) => (
                <div key={response.id} className="rounded-lg border border-line bg-white p-3">
                  {editingResponseId === response.id && admin ? (
                    <form onSubmit={(event) => onUpdateResponse(event, response)} className="grid gap-3">
                      <Field label="Nombre"><Input name="participantName" required defaultValue={response.participantName} /></Field>
                      <div className="grid grid-cols-2 gap-2"><Field label="Día"><Input name="availableDate" type="date" required defaultValue={response.availableDate} /></Field><Field label="Hora"><Input name="availableTime" type="time" required defaultValue={response.availableTime} /></Field></div>
                      <Field label="Nota" hint="Opcional"><Input name="note" maxLength={240} defaultValue={response.note ?? ""} /></Field>
                      <div className="flex gap-2"><Button type="submit" disabled={busy}>Guardar</Button><button type="button" onClick={() => onEditResponse(null)} className="px-3 text-xs font-semibold text-muted">Cancelar</button></div>
                    </form>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="inline-flex items-center gap-1.5 font-semibold"><UserRound className="size-4 text-forest" />{response.participantName}</p>
                        <p className="mt-1 text-sm text-muted">{formatLongDate(response.availableDate)} · {response.availableTime}</p>
                        {response.note ? <p className="mt-1 text-xs text-muted">{response.note}</p> : null}
                      </div>
                      {admin ? <div className="flex gap-1"><button type="button" onClick={() => onEditResponse(response.id)} className="grid size-8 place-items-center rounded-md border border-line text-forest" aria-label="Editar participación"><Pencil className="size-3.5" /></button><button type="button" onClick={() => onRemoveResponse(response)} className="grid size-8 place-items-center rounded-md border border-danger/20 text-danger" aria-label="Eliminar participación"><Trash2 className="size-3.5" /></button></div> : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {poll.isOpen ? (
            <FormBox title="Anotar mi disponibilidad" onSubmit={onVote}>
              <div className="rounded-lg border border-forest/10 bg-forest-soft p-3 text-sm text-forest-deep">
                <strong>No necesitas registrarte.</strong> Escribe tu nombre y selecciona el día y la hora que te funcionan mejor.
              </div>
              <Field label="Tu nombre"><Input name="participantName" required minLength={2} maxLength={80} placeholder="Nombre y apellido" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Día disponible"><Input name="availableDate" type="date" required defaultValue={poll.eventDate ?? getTodayIso()} /></Field>
                <Field label="Hora disponible"><Input name="availableTime" type="time" required /></Field>
              </div>
              <Field label="Comentario" hint="Opcional"><Textarea name="note" maxLength={240} placeholder="Ej. También puedo una hora después." /></Field>
              <div className="hidden" aria-hidden="true"><Input name="website" tabIndex={-1} autoComplete="off" /></div>
              {localMessage ? <p className="inline-flex items-center gap-2 text-sm font-medium text-forest"><CheckCircle2 className="size-4" />{localMessage}</p> : null}
              <Button type="submit" disabled={busy}><Vote className="mr-2 size-4" />Guardar mi disponibilidad</Button>
            </FormBox>
          ) : (
            <Card className="bg-bg-warm/60">
              <p className="font-display text-2xl">Votación cerrada</p>
              <p className="mt-2 text-sm text-muted">La lista y los resultados siguen visibles, pero ya no se aceptan nuevas participaciones.</p>
            </Card>
          )}
        </div>
      </div>
    </Card>
  );
}

function summarizeSlots(responses: VoteResponse[]) {
  const map = new Map<string, { key: string; date: string; time: string; count: number }>();
  for (const response of responses) {
    const key = `${response.availableDate}|${response.availableTime}`;
    const current = map.get(key) ?? { key, date: response.availableDate, time: response.availableTime, count: 0 };
    current.count += 1;
    map.set(key, current);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}
