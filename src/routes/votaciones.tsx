import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  MapPin,
  Pencil,
  Trash2,
  UserRound,
  UsersRound,
  Vote,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { Button, Card, Field, FormBox, Input, Pill, Textarea, cn } from "@/components/ui";
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
  type AvailabilityMode,
  type VoteResponse,
} from "@/lib/votaciones";

export const Route = createFileRoute("/votaciones")({ component: VotacionesPage });

const DEFAULT_PROMPT = "¿Qué día y hora puedes asistir?";

const WEEKDAYS = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
] as const;

const WEEKDAY_LABELS = Object.fromEntries(WEEKDAYS.map((day) => [day.value, day.label])) as Record<string, string>;
const WEEK_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function normalizeHttpUrl(value: string) {
  const clean = value.trim();
  if (!clean) return "";
  if (/^https?:\/\//i.test(clean)) return clean;
  return `https://${clean}`;
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

function pollCalendarDate(poll: ActivityPoll) {
  return poll.scheduledDate || poll.eventDate || null;
}

function VotacionesPage() {
  const { user, directory } = useDirectory();
  const admin = isModerator(directory);
  const pollsQuery = useQuery({
    queryKey: ["activity-polls"],
    queryFn: () => loadPolls(),
    staleTime: 5_000,
  });
  const polls = pollsQuery.data ?? [];
  const today = getTodayIso();
  const [monthCursor, setMonthCursor] = useState(`${today.slice(0, 7)}-01`);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPollId, setSelectedPollId] = useState<number | null>(null);
  const [editingPollId, setEditingPollId] = useState<number | null>(null);
  const [editingResponseId, setEditingResponseId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);

  const selectedPoll = polls.find((poll) => poll.id === selectedPollId) ?? polls.find((poll) => poll.isOpen) ?? polls[0] ?? null;
  const activePolls = polls.filter((poll) => poll.isOpen);
  const scheduledPolls = polls.filter((poll) => Boolean(pollCalendarDate(poll)));
  const totalParticipants = polls.reduce((sum, poll) => sum + poll.responses.length, 0);

  const calendarCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const poll of polls) {
      const date = pollCalendarDate(poll);
      if (date) map.set(date, (map.get(date) ?? 0) + 1);
    }
    return map;
  }, [polls]);

  const calendarCells = useMemo(() => monthCells(monthCursor), [monthCursor]);
  const pollsForSelectedDate = selectedDate ? polls.filter((poll) => pollCalendarDate(poll) === selectedDate) : [];
  const upcomingPolls = useMemo(
    () => scheduledPolls
      .filter((poll) => (pollCalendarDate(poll) ?? "") >= today)
      .sort((a, b) => (pollCalendarDate(a) ?? "").localeCompare(pollCalendarDate(b) ?? ""))
      .slice(0, 6),
    [scheduledPolls, today],
  );
  const undatedPolls = polls.filter((poll) => !pollCalendarDate(poll));

  async function refresh() {
    await pollsQuery.refetch();
  }

  function choosePoll(poll: ActivityPoll) {
    setSelectedPollId(poll.id);
    const date = pollCalendarDate(poll);
    if (date) {
      setSelectedDate(date);
      setMonthCursor(`${date.slice(0, 7)}-01`);
    }
    window.setTimeout(() => document.getElementById(`votacion-${poll.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function chooseDate(date: string) {
    setSelectedDate(date);
    const first = polls.find((poll) => pollCalendarDate(poll) === date);
    if (first) setSelectedPollId(first.id);
  }

  async function onCreateStandalone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setPageError(null); setPageSuccess(null);
    try {
      const result = await createPoll({ data: {
        title: String(data.get("title") ?? "").trim(),
        prompt: String(data.get("prompt") ?? DEFAULT_PROMPT).trim(),
        description: String(data.get("description") ?? "").trim(),
        scheduledDate: String(data.get("scheduledDate") ?? ""),
        scheduledTime: String(data.get("scheduledTime") ?? "").trim(),
        locationText: String(data.get("locationText") ?? "").trim(),
        mapsUrl: normalizeHttpUrl(String(data.get("mapsUrl") ?? "")),
        notes: String(data.get("notes") ?? "").trim(),
      } });
      form.reset();
      setSelectedPollId(result.id);
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
        scheduledDate: String(data.get("scheduledDate") ?? ""),
        scheduledTime: String(data.get("scheduledTime") ?? "").trim(),
        locationText: String(data.get("locationText") ?? "").trim(),
        mapsUrl: normalizeHttpUrl(String(data.get("mapsUrl") ?? "")),
        notes: String(data.get("notes") ?? "").trim(),
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
      if (selectedPollId === poll.id) setSelectedPollId(null);
      setPageSuccess("Votación eliminada.");
      await refresh();
    } catch (cause) {
      setPageError(cause instanceof Error ? cause.message : "No se pudo eliminar la votación.");
    } finally { setBusy(false); }
  }

  return (
    <Shell
      eyebrow="Votaciones · Grupo 9114"
      title="Votaciones, acuerdos y disponibilidad del grupo."
      lead="Consulta el calendario de actividades, revisa qué fecha y horario tienen mayor apoyo y apúntate sin necesidad de crear una cuenta."
    >
      <Card className="unam-hero-card hero-glow mb-7">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-bg/60">Participación abierta</p>
            <h2 className="mt-2 font-display text-3xl">Organiza actividades y encuentra la mejor fecha.</h2>
            <p className="mt-2 max-w-2xl text-sm text-bg/75">
              El calendario marca los compromisos y actividades con fecha pactada. Cada votación resume la fecha, horario y participantes con mayor coincidencia.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <HeroStat value={activePolls.length} label="actividades activas" />
            <HeroStat value={scheduledPolls.length} label="con fecha" />
            <HeroStat value={totalParticipants} label="participaciones" />
          </div>
        </div>
      </Card>

      {pageError ? <p className="mb-4 rounded-lg border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger">{pageError}</p> : null}
      {pageSuccess ? <p className="mb-4 rounded-lg bg-forest-soft px-4 py-3 text-sm font-medium text-forest-deep">{pageSuccess}</p> : null}

      <section className="mb-7 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,.85fr)]">
        <Card className="overflow-hidden p-0">
          <div className="unam-hero px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/65">Calendario de compromisos</p>
                <h2 className="mt-1 font-display text-3xl capitalize text-white">{monthLabel(monthCursor)}</h2>
                <p className="mt-1 text-sm text-white/70">Los círculos dorados indican cuántas actividades tienen una fecha pactada ese día.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setMonthCursor(shiftMonth(monthCursor, -1))} className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white" aria-label="Mes anterior"><ChevronLeft className="size-5" /></button>
                <button type="button" onClick={() => { setMonthCursor(`${today.slice(0, 7)}-01`); setSelectedDate(today); }} className="rounded-full border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white">Hoy</button>
                <button type="button" onClick={() => setMonthCursor(shiftMonth(monthCursor, 1))} className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white" aria-label="Mes siguiente"><ChevronRight className="size-5" /></button>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              {WEEK_LABELS.map((label) => <span key={label} className="py-2">{label}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((date, index) => {
                if (!date) return <span key={`blank-${index}`} className="aspect-square" />;
                const count = calendarCounts.get(date) ?? 0;
                const selected = selectedDate === date;
                const isToday = date === today;
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => chooseDate(date)}
                    className={cn(
                      "relative grid aspect-square place-items-center rounded-full text-sm font-semibold transition-all",
                      selected ? "bg-forest text-white shadow-md" : count ? "bg-clay/10 text-ink hover:bg-clay/20" : isToday ? "bg-forest-soft text-forest-deep" : "text-ink-soft hover:bg-bg-warm",
                    )}
                  >
                    {Number(date.slice(-2))}
                    {count ? <span className={cn("absolute -bottom-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full px-1 py-0.5 text-[10px] font-bold", selected ? "bg-clay text-white" : "bg-clay/20 text-clay")}>{count}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">{selectedDate ? "Fecha seleccionada" : "Próximas actividades"}</p>
              <h2 className="mt-1 font-display text-2xl">{selectedDate ? formatLongDate(selectedDate) : "Compromisos del grupo"}</h2>
            </div>
            <Pill tone="forest">{selectedDate ? pollsForSelectedDate.length : upcomingPolls.length}</Pill>
          </div>
          <div className="mt-4 grid gap-2">
            {(selectedDate ? pollsForSelectedDate : upcomingPolls).map((poll) => (
              <button
                key={poll.id}
                type="button"
                onClick={() => choosePoll(poll)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm",
                  selectedPoll?.id === poll.id ? "border-forest bg-forest-soft" : "border-line bg-bg-warm/55",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{poll.title}</p>
                    <p className="mt-1 text-xs text-muted">{pollCalendarDate(poll) ? formatLongDate(pollCalendarDate(poll)!) : "Sin fecha"}{(poll.scheduledTime || poll.eventTime) ? ` · ${poll.scheduledTime || poll.eventTime}` : ""}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-forest">Ver votación</span>
                </div>
              </button>
            ))}
            {selectedDate && !pollsForSelectedDate.length ? <p className="rounded-lg bg-bg-warm p-4 text-sm text-muted">No hay actividades pactadas para esta fecha.</p> : null}
            {!selectedDate && !upcomingPolls.length ? <p className="rounded-lg bg-bg-warm p-4 text-sm text-muted">Todavía no hay próximas actividades con fecha pactada.</p> : null}
          </div>

          {undatedPolls.length ? (
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Sin fecha pactada</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {undatedPolls.slice(0, 6).map((poll) => (
                  <button key={poll.id} type="button" onClick={() => choosePoll(poll)} className="rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-forest">{poll.title}</button>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </section>

      {admin ? (
        <div className="mb-7">
          <FormBox title="Nueva votación independiente" onSubmit={onCreateStandalone}>
            <p className="text-sm text-muted">También puedes crear votaciones ligadas automáticamente a una actividad desde Agenda.</p>
            <PollDetailsFields />
            <Button type="submit" disabled={busy}><Vote className="mr-2 size-4" />Crear votación</Button>
          </FormBox>
        </div>
      ) : null}

      {pollsQuery.isPending ? <Card><p className="text-sm text-muted">Cargando votaciones…</p></Card> : null}
      {pollsQuery.isError ? <Card><p className="text-sm text-danger">No se pudieron cargar las votaciones. Revisa que las migraciones 0015, 0016 y 0017 se hayan aplicado en Neon.</p></Card> : null}

      {selectedPoll ? (
        <PollCard
          key={selectedPoll.id}
          poll={selectedPoll}
          canEditPoll={canEditPublication(directory, user?.id, selectedPoll.createdBy)}
          admin={admin}
          editing={editingPollId === selectedPoll.id}
          busy={busy}
          editingResponseId={editingResponseId}
          onStartEdit={() => setEditingPollId(selectedPoll.id)}
          onCancelEdit={() => setEditingPollId(null)}
          onUpdatePoll={(event) => onUpdatePoll(event, selectedPoll)}
          onRemovePoll={() => onRemovePoll(selectedPoll)}
          onRefresh={refresh}
          onBusy={setBusy}
          onError={setPageError}
          onSuccess={setPageSuccess}
          onEditResponse={setEditingResponseId}
        />
      ) : !pollsQuery.isPending ? (
        <Card>
          <p className="font-display text-2xl">Todavía no hay votaciones.</p>
          <p className="mt-2 text-sm text-muted">Cuando una actividad de Agenda abra una votación aparecerá aquí.</p>
          <Link to="/agenda" className="mt-4 inline-flex text-sm font-semibold text-forest">Ver actividades</Link>
        </Card>
      ) : null}
    </Shell>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-24 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-4 text-center">
      <p className="font-display text-3xl leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-bg/60">{label}</p>
    </div>
  );
}

function PollDetailsFields({ poll }: { poll?: ActivityPoll }) {
  return (
    <>
      <Field label="Título"><Input name="title" required maxLength={180} defaultValue={poll?.title ?? ""} placeholder="Curso de argumentación jurídica" /></Field>
      <Field label="Pregunta"><Input name="prompt" required maxLength={300} defaultValue={poll?.prompt ?? DEFAULT_PROMPT} /></Field>
      <Field label="Descripción" hint="Opcional"><Textarea name="description" maxLength={2400} defaultValue={poll?.description ?? ""} placeholder="Información del curso, objetivo, condiciones o indicaciones." /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Fecha pactada" hint="Opcional"><Input name="scheduledDate" type="date" defaultValue={poll?.scheduledDate ?? poll?.eventDate ?? ""} /></Field>
        <Field label="Horario pactado" hint="Opcional"><Input name="scheduledTime" maxLength={80} defaultValue={poll?.scheduledTime ?? poll?.eventTime ?? ""} placeholder="17:00–19:00" /></Field>
      </div>
      <Field label="Lugar / referencia" hint="Opcional"><Input name="locationText" maxLength={240} defaultValue={poll?.locationText ?? poll?.eventPlace ?? ""} placeholder="Facultad, salón, cafetería o punto de reunión" /></Field>
      <Field label="Liga de Google Maps" hint="Opcional"><Input name="mapsUrl" type="url" defaultValue={poll?.mapsUrl ?? ""} placeholder="https://maps.app.goo.gl/..." /></Field>
      <Field label="Comentarios o notas" hint="Opcional"><Textarea name="notes" maxLength={4000} defaultValue={poll?.notes ?? ""} placeholder="Costo, materiales, contacto, requisitos, indicaciones adicionales…" /></Field>
    </>
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
  const [availabilityMode, setAvailabilityMode] = useState<AvailabilityMode>("specific");
  const [preferredWeekdays, setPreferredWeekdays] = useState<string[]>([]);
  const summary = useMemo(() => buildVoteSummary(poll.responses), [poll.responses]);
  const displayDate = poll.scheduledDate || poll.eventDate || summary.topDate?.date || null;
  const displayTime = poll.scheduledTime || poll.eventTime || summary.topTime?.time || null;
  const location = poll.locationText || poll.eventPlace || null;

  async function onVote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    onBusy(true); onError(null); onSuccess(null); setLocalMessage(null);
    try {
      await savePublicVote({ data: {
        pollId: poll.id,
        participantName: String(data.get("participantName") ?? "").trim(),
        availabilityMode,
        availableDate: String(data.get("availableDate") ?? ""),
        availableTime: String(data.get("availableTime") ?? ""),
        preferredWeekdays: data.getAll("preferredWeekdays").map(String),
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
        availabilityMode: String(data.get("availabilityMode") ?? "specific") as AvailabilityMode,
        availableDate: String(data.get("availableDate") ?? ""),
        availableTime: String(data.get("availableTime") ?? ""),
        preferredWeekdays: data.getAll("preferredWeekdays").map(String),
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
    <Card id={`votacion-${poll.id}`} className="scroll-mt-6 overflow-hidden p-0">
      <div className="border-b border-line p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={poll.isOpen ? "forest" : "neutral"}>{poll.isOpen ? "Abierta" : "Cerrada"}</Pill>
              <Pill><UsersRound className="mr-1 size-3" />{poll.responses.length} personas</Pill>
              {poll.scheduledDate ? <Pill tone="clay"><CalendarCheck2 className="mr-1 size-3" />Fecha pactada</Pill> : null}
            </div>
            <h2 className="mt-3 font-display text-3xl">{poll.title}</h2>
            <p className="mt-2 font-medium text-forest">{poll.prompt}</p>
            {poll.description ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{poll.description}</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
              {displayDate ? <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" />{formatLongDate(displayDate)}</span> : null}
              {displayTime ? <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{displayTime}</span> : null}
              {location ? <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{location}</span> : null}
              {poll.mapsUrl ? <a href={poll.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-forest"><ExternalLink className="size-3.5" />Abrir Google Maps</a> : null}
            </div>
            {poll.notes ? <div className="mt-4 rounded-lg border border-line bg-bg-warm/55 p-3 text-sm leading-relaxed text-ink-soft"><strong className="text-ink">Notas:</strong> {poll.notes}</div> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {canEditPoll ? <button type="button" onClick={onStartEdit} className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-line bg-white px-3 text-xs font-semibold text-forest"><Pencil className="size-3.5" />Editar</button> : null}
            {admin ? <button type="button" onClick={onRemovePoll} className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-danger/20 bg-red-50 px-3 text-xs font-semibold text-danger"><Trash2 className="size-3.5" />Eliminar</button> : null}
          </div>
        </div>

        {editing ? (
          <form onSubmit={onUpdatePoll} className="mt-5 grid gap-3 rounded-xl border border-line bg-bg-warm/60 p-4">
            <div className="flex items-center justify-between"><p className="font-semibold">Editar votación</p><button type="button" onClick={onCancelEdit} className="inline-flex items-center gap-1 text-xs font-semibold text-forest"><X className="size-3.5" />Cancelar</button></div>
            <PollDetailsFields poll={poll} />
            <label className="flex items-center gap-2 text-sm font-medium"><input name="isOpen" type="checkbox" defaultChecked={poll.isOpen} className="size-4" />Aceptar nuevas participaciones</label>
            <Button type="submit" disabled={busy}>Guardar cambios</Button>
          </form>
        ) : null}
      </div>

      <div className="border-b border-line bg-bg-warm/35 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">Resumen de la votación</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <SummaryCard
            label={poll.scheduledDate || poll.eventDate ? "Fecha seleccionada" : "Fecha más elegida"}
            value={displayDate ? formatLongDate(displayDate) : summary.topWeekday ? WEEKDAY_LABELS[summary.topWeekday.day] : "Por definir"}
            detail={poll.scheduledDate || poll.eventDate ? "Actividad calendarizada" : summary.topDate ? `${summary.topDate.count} voto${summary.topDate.count === 1 ? "" : "s"}` : summary.topWeekday ? `${summary.topWeekday.count} preferencias` : "Sin votos de fecha"}
          />
          <SummaryCard
            label={poll.scheduledTime || poll.eventTime ? "Horario seleccionado" : "Horario más elegido"}
            value={displayTime || "Por definir"}
            detail={poll.scheduledTime || poll.eventTime ? "Horario pactado" : summary.topTime ? `${summary.topTime.count} preferencia${summary.topTime.count === 1 ? "" : "s"}` : "Sin horario definido"}
          />
          <SummaryCard
            label="Personas apuntadas"
            value={String(poll.responses.length)}
            detail={poll.responses.length ? poll.responses.map((item) => item.participantName).join(", ") : "Todavía nadie se ha apuntado"}
          />
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(19rem,.8fr)_minmax(0,1.2fr)]">
        <div>
          <h3 className="font-display text-2xl">Disponibilidad</h3>
          {!summary.slots.length && !summary.weekdays.length && !summary.flexibleCount ? (
            <p className="mt-3 text-sm text-muted">Todavía no hay personas registradas.</p>
          ) : (
            <div className="mt-3 grid gap-3">
              {summary.flexibleCount ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-forest/15 bg-forest-soft px-3 py-3">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-forest">Flexibles</p><p className="mt-1 font-semibold">Me adapto · cualquier día y hora</p></div>
                  <span className="grid min-w-10 place-items-center rounded-full bg-forest px-3 py-2 text-sm font-bold text-white">{summary.flexibleCount}</span>
                </div>
              ) : null}
              {summary.weekdays.length ? (
                <div className="rounded-lg border border-line bg-bg-warm/45 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-clay">Días con más disponibilidad</p>
                  <div className="mt-2 grid gap-2">
                    {summary.weekdays.map((day) => <div key={day.day} className="flex items-center justify-between gap-3 text-sm"><span className="font-medium">{WEEKDAY_LABELS[day.day] ?? day.day}</span><span className="rounded-full bg-white px-2.5 py-1 font-semibold text-forest shadow-sm">{day.count}</span></div>)}
                  </div>
                </div>
              ) : null}
              {summary.slots.slice(0, 6).map((slot, index) => (
                <div key={slot.key} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-warm/55 px-3 py-3">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-clay">{index === 0 ? "Fecha/hora más elegida" : "Fecha y hora"}</p><p className="mt-1 font-semibold">{formatLongDate(slot.date)} · {slot.time}</p></div>
                  <span className="grid min-w-10 place-items-center rounded-full bg-forest px-3 py-2 text-sm font-bold text-white">{slot.count}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5">
            <h3 className="font-display text-xl">Personas registradas</h3>
            <div className="mt-3 grid gap-2">
              {poll.responses.map((response) => (
                <div key={response.id} className="rounded-lg border border-line bg-white p-3">
                  {editingResponseId === response.id && admin ? (
                    <ResponseEditForm response={response} busy={busy} onSubmit={(event) => onUpdateResponse(event, response)} onCancel={() => onEditResponse(null)} />
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="inline-flex items-center gap-1.5 font-semibold"><UserRound className="size-4 text-forest" />{response.participantName}</p>
                        <p className="mt-1 text-sm text-muted">{describeAvailability(response)}</p>
                        {response.note ? <p className="mt-1 text-xs text-muted">{response.note}</p> : null}
                      </div>
                      {admin ? <div className="flex gap-1"><button type="button" onClick={() => onEditResponse(response.id)} className="grid size-8 place-items-center rounded-md border border-line text-forest" aria-label="Editar participación"><Pencil className="size-3.5" /></button><button type="button" onClick={() => onRemoveResponse(response)} className="grid size-8 place-items-center rounded-md border border-danger/20 text-danger" aria-label="Eliminar participación"><Trash2 className="size-3.5" /></button></div> : null}
                    </div>
                  )}
                </div>
              ))}
              {!poll.responses.length ? <p className="text-sm text-muted">La lista aparecerá aquí conforme se apunten.</p> : null}
            </div>
          </div>
        </div>

        <div>
          {poll.isOpen ? (
            <FormBox title="Anotar mi disponibilidad" onSubmit={onVote}>
              <div className="rounded-lg border border-forest/10 bg-forest-soft p-3 text-sm text-forest-deep">
                <strong>No necesitas registrarte.</strong> Puedes indicar una fecha exacta, marcar varios días de la semana o elegir <strong>Me adapto</strong>.
              </div>
              <Field label="Tu nombre"><Input name="participantName" required minLength={2} maxLength={80} placeholder="Nombre y apellido" /></Field>
              <AvailabilityFields
                mode={availabilityMode}
                onModeChange={setAvailabilityMode}
                selectedWeekdays={preferredWeekdays}
                onWeekdaysChange={setPreferredWeekdays}
                defaultDate={poll.scheduledDate ?? poll.eventDate ?? getTodayIso()}
              />
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

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl leading-tight text-ink">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">{detail}</p>
    </div>
  );
}

function ResponseEditForm({
  response,
  busy,
  onSubmit,
  onCancel,
}: {
  response: VoteResponse;
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<AvailabilityMode>(response.availabilityMode);
  const [weekdays, setWeekdays] = useState<string[]>(response.preferredWeekdays);
  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <Field label="Nombre"><Input name="participantName" required defaultValue={response.participantName} /></Field>
      <AvailabilityFields mode={mode} onModeChange={setMode} selectedWeekdays={weekdays} onWeekdaysChange={setWeekdays} defaultDate={response.availableDate ?? getTodayIso()} defaultTime={response.availableTime ?? ""} />
      <Field label="Nota" hint="Opcional"><Input name="note" maxLength={240} defaultValue={response.note ?? ""} /></Field>
      <div className="flex gap-2"><Button type="submit" disabled={busy}>Guardar</Button><button type="button" onClick={onCancel} className="px-3 text-xs font-semibold text-muted">Cancelar</button></div>
    </form>
  );
}

function AvailabilityFields({
  mode,
  onModeChange,
  selectedWeekdays,
  onWeekdaysChange,
  defaultDate,
  defaultTime = "",
}: {
  mode: AvailabilityMode;
  onModeChange: (mode: AvailabilityMode) => void;
  selectedWeekdays: string[];
  onWeekdaysChange: (days: string[]) => void;
  defaultDate: string;
  defaultTime?: string;
}) {
  function toggleWeekday(day: string) {
    onWeekdaysChange(selectedWeekdays.includes(day) ? selectedWeekdays.filter((item) => item !== day) : [...selectedWeekdays, day]);
  }

  return (
    <div className="grid gap-3">
      <div>
        <p className="mb-2 text-sm font-medium text-ink-soft">Cómo te acomoda</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { value: "specific" as const, label: "Fecha y hora" },
            { value: "flexible" as const, label: "Me adapto" },
            { value: "weekdays" as const, label: "Varios días" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onModeChange(option.value)}
              className={mode === option.value
                ? "min-h-11 rounded-md border border-forest bg-forest px-3 text-sm font-semibold text-white shadow-sm"
                : "min-h-11 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink-soft transition hover:border-forest/40"}
            >
              {option.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="availabilityMode" value={mode} />
      </div>

      {mode === "specific" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Día disponible"><Input name="availableDate" type="date" required defaultValue={defaultDate} /></Field>
          <Field label="Hora disponible"><Input name="availableTime" type="time" required defaultValue={defaultTime} /></Field>
        </div>
      ) : null}

      {mode === "flexible" ? (
        <div className="rounded-lg border border-forest/15 bg-forest-soft px-4 py-3 text-sm text-forest-deep">
          <strong>Me adapto.</strong> No necesitas seleccionar día ni hora; quedará registrado que puedes ajustarte a la opción que el grupo decida.
        </div>
      ) : null}

      {mode === "weekdays" ? (
        <div className="grid gap-3 rounded-lg border border-line bg-white p-3">
          <div>
            <p className="text-sm font-medium text-ink-soft">Días que te funcionan</p>
            <p className="mt-1 text-xs text-muted">Puedes marcar varios, por ejemplo lunes, miércoles y domingo.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => {
              const selected = selectedWeekdays.includes(day.value);
              return (
                <label key={day.value} className={selected ? "cursor-pointer rounded-full border border-forest bg-forest px-3 py-2 text-xs font-semibold text-white" : "cursor-pointer rounded-full border border-line bg-bg-warm px-3 py-2 text-xs font-semibold text-ink-soft"}>
                  <input type="checkbox" name="preferredWeekdays" value={day.value} checked={selected} onChange={() => toggleWeekday(day.value)} className="sr-only" />
                  {day.label}
                </label>
              );
            })}
          </div>
          <Field label="Hora preferida" hint="Opcional"><Input name="availableTime" type="time" defaultValue={defaultTime} /></Field>
        </div>
      ) : null}
    </div>
  );
}

function describeAvailability(response: VoteResponse) {
  if (response.availabilityMode === "flexible") return "Me adapto · cualquier día y hora";
  if (response.availabilityMode === "weekdays") {
    const days = response.preferredWeekdays.map((day) => WEEKDAY_LABELS[day] ?? day).join(", ");
    return `${days || "Varios días"}${response.availableTime ? ` · Preferencia ${response.availableTime}` : " · cualquier hora"}`;
  }
  return `${response.availableDate ? formatLongDate(response.availableDate) : "Fecha por definir"}${response.availableTime ? ` · ${response.availableTime}` : ""}`;
}

function buildVoteSummary(responses: VoteResponse[]) {
  const slotMap = new Map<string, { key: string; date: string; time: string; count: number }>();
  const dateMap = new Map<string, number>();
  const timeMap = new Map<string, number>();
  const weekdayMap = new Map<string, number>();
  let flexibleCount = 0;

  for (const response of responses) {
    if (response.availabilityMode === "flexible") flexibleCount += 1;
    if (response.availableTime) timeMap.set(response.availableTime, (timeMap.get(response.availableTime) ?? 0) + 1);
    if (response.availabilityMode === "specific" && response.availableDate) {
      dateMap.set(response.availableDate, (dateMap.get(response.availableDate) ?? 0) + 1);
      if (response.availableTime) {
        const key = `${response.availableDate}|${response.availableTime}`;
        const current = slotMap.get(key) ?? { key, date: response.availableDate, time: response.availableTime, count: 0 };
        current.count += 1;
        slotMap.set(key, current);
      }
    }
    if (response.availabilityMode === "weekdays") {
      for (const day of response.preferredWeekdays) weekdayMap.set(day, (weekdayMap.get(day) ?? 0) + 1);
    }
  }

  const slots = [...slotMap.values()].sort((a, b) => b.count - a.count || a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const dates = [...dateMap.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => b.count - a.count || a.date.localeCompare(b.date));
  const times = [...timeMap.entries()].map(([time, count]) => ({ time, count })).sort((a, b) => b.count - a.count || a.time.localeCompare(b.time));
  const weekdays = [...weekdayMap.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => b.count - a.count || WEEKDAYS.findIndex((item) => item.value === a.day) - WEEKDAYS.findIndex((item) => item.value === b.day));

  return {
    flexibleCount,
    slots,
    dates,
    times,
    weekdays,
    topDate: dates[0] ?? null,
    topTime: times[0] ?? null,
    topWeekday: weekdays[0] ?? null,
  };
}
