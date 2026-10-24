import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { signOut } from "@/lib/auth/client";
import { formatMexico, mexicoDateInput, mexicoTimeInput, startOfMexicoDay, endOfMexicoWeek } from "@/lib/personal/dates";
import { deletePersonal, loadPersonal, personalAccess, progressPersonal, reviewPersonal, runPersonalReminders, savePersonal, sendPersonalTest, setPersonalStatus } from "@/lib/personal/functions";
import { googleCalendarLink } from "@/lib/personal/ics";
import { KIND_LABEL, PERSONAL_KINDS, REMINDER_CHOICES, anchorOf, isHighlighted, type PersonalItem, type PersonalKind, type PersonalPriority, type ProgressUnit } from "@/lib/personal/model";
import { applyReview, intervalLabel } from "@/lib/personal/srs";

type Access = { personal: boolean; state: "off" | "anonymous" | "denied" | "owner" };
type Bundle = Awaited<ReturnType<typeof loadPersonal>>;
type Tab = "agenda" | "repasos" | "lecturas" | "todo";

type Draft = {
  id?: string;
  kind: PersonalKind;
  title: string;
  notes: string;
  subject: string;
  location: string;
  url: string;
  date: string;
  time: string;
  allDay: boolean;
  priority: PersonalPriority;
  reminderMinutes: number[];
  progressCurrent: number;
  progressTotal: number;
  progressUnit: ProgressUnit;
};

const emptyDraft = (): Draft => ({
  kind: "tarea",
  title: "",
  notes: "",
  subject: "",
  location: "",
  url: "",
  date: "",
  time: "",
  allDay: false,
  priority: "normal",
  reminderMinutes: [1440, 60],
  progressCurrent: 0,
  progressTotal: 0,
  progressUnit: "paginas",
});

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "No se pudo guardar.";
}

export function PersonalHome({ portalUrl }: { portalUrl: string | null }) {
  const [access, setAccess] = useState<Access | null>(null);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [tab, setTab] = useState<Tab>("agenda");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dark, setDark] = useState(false);

  async function refresh() {
    const next = await loadPersonal();
    setBundle(next);
  }

  useEffect(() => {
    document.title = "pnota · espacio personal";
    const meta = document.querySelector('meta[name="robots"]') ?? document.head.appendChild(document.createElement("meta"));
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex, nofollow");
    try { setDark(localStorage.getItem("fd-theme") === "dark"); } catch { /* preferencia local */ }
    personalAccess().then(setAccess).catch(() => setAccess({ personal: true, state: "anonymous" }));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try { localStorage.setItem("fd-theme", dark ? "dark" : "light"); } catch { /* preferencia local */ }
  }, [dark]);

  useEffect(() => {
    if (access?.state !== "owner") return;
    refresh().catch((cause) => setError(messageOf(cause)));
    runPersonalReminders().then((result) => {
      if (result.sent > 0) setNotice(`Se enviaron ${result.sent} recordatorios.`);
    }).catch(() => undefined);
  }, [access?.state]);

  const items = useMemo(() => bundle?.items ?? [], [bundle]);
  const urgent = useMemo(() => items.filter(isHighlighted).sort((a, b) => (anchorOf(a) ?? "9999").localeCompare(anchorOf(b) ?? "9999")), [items]);
  const reviews = items.filter((item) => item.kind === "repaso" && item.status === "pendiente");
  const readings = items.filter((item) => item.kind === "lectura" && item.status !== "archivado");

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await savePersonal({ data: { ...draft, date: draft.date || null, time: draft.time || null } });
      setDraft(emptyDraft());
      setMore(false);
      setNotice(draft.id ? "Cambios guardados." : "Quedó anotado.");
      await refresh();
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  }

  function edit(item: PersonalItem) {
    const anchor = anchorOf(item);
    setDraft({
      id: item.id,
      kind: item.kind,
      title: item.title,
      notes: item.notes,
      subject: item.subject,
      location: item.location,
      url: item.url,
      date: mexicoDateInput(anchor),
      time: mexicoTimeInput(anchor, item.allDay),
      allDay: item.allDay,
      priority: item.priority,
      reminderMinutes: item.reminderMinutes,
      progressCurrent: item.progressCurrent,
      progressTotal: item.progressTotal,
      progressUnit: item.progressUnit,
    });
    setMore(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!access) return <main className="pn-app"><p className="pn-muted">Abriendo tu espacio…</p></main>;
  if (access.state === "off") return <main className="pn-app"><section className="pn-card"><h1>Espacio personal</h1><p>Se abre en el dominio del titular.</p></section></main>;
  if (access.state === "anonymous") {
    return <main className="pn-app"><section className="pn-card"><p className="pn-kicker">pnota.com</p><h1>Espacio personal</h1><p>Entra con la cuenta del titular. Las demás cuentas no ven esta información.</p><Link to="/login" search={{ mode: "entrar" }} className="pn-button">Entrar</Link></section></main>;
  }
  if (access.state !== "owner") {
    return <main className="pn-app"><section className="pn-card"><h1>Esta entrada no está disponible</h1><p>La cuenta con la que entraste no es la del titular.</p><button className="pn-button" type="button" onClick={() => signOut("/")}>Cerrar sesión</button></section></main>;
  }

  return <div className="pn-app">
    <header className="pn-top">
      <div><p className="pn-kicker">pnota.com</p><strong>Espacio personal</strong></div>
      <div className="pn-top-actions">
        <button type="button" className="pn-ghost" onClick={() => setDark((value) => !value)}>{dark ? "Claro" : "Oscuro"}</button>
        <button type="button" className="pn-ghost" onClick={() => signOut("/")}>Salir</button>
      </div>
    </header>
    <section className="pn-urgent" aria-labelledby="urgentes">
      <h1 id="urgentes">Fechas que importan</h1>
      <p>Tareas, exámenes y lo que marcaste como importante.</p>
      {urgent.length ? <ul className="pn-list">{urgent.map((item) => <ItemCard key={item.id} item={item} onEdit={edit} onChanged={refresh} />)}</ul> : <p className="pn-muted">No hay tareas, exámenes ni pendientes marcados. Cuando agregues una fecha, aparecerá aquí.</p>}
    </section>
    <form className="pn-card pn-form" onSubmit={onSave}>
      <h2>{draft.id ? "Editar" : "Nueva entrada"}</h2>
      <label>Qué es<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required minLength={2} maxLength={180} placeholder="Leer amparo, examen de civil…" /></label>
      <div className="pn-row">
        <label>Tipo<select value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as PersonalKind })}>{PERSONAL_KINDS.map((kind) => <option key={kind} value={kind}>{KIND_LABEL[kind]}</option>)}</select></label>
        <label>Prioridad<select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as PersonalPriority })}><option value="normal">Normal</option><option value="importante">Importante</option><option value="critico">Muy importante</option></select></label>
      </div>
      <div className="pn-row">
        <label>Fecha<input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label>
        <label>Hora<input type="time" value={draft.time} disabled={draft.allDay} onChange={(event) => setDraft({ ...draft, time: event.target.value })} /></label>
      </div>
      <label className="pn-check"><input type="checkbox" checked={draft.allDay} onChange={(event) => setDraft({ ...draft, allDay: event.target.checked, time: event.target.checked ? "" : draft.time })} /> Todo el día</label>
      <button type="button" className="pn-linkish" onClick={() => setMore((value) => !value)}>{more ? "Ocultar detalles" : "Materia, recordatorios y notas"}</button>
      {more ? <div className="pn-more">
        <label>Materia<input value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} maxLength={120} /></label>
        <label>Lugar o liga de la clase<input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} maxLength={200} placeholder="Aula, Zoom, Classroom…" /></label>
        <label>Enlace<input value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} inputMode="url" placeholder="https://" /></label>
        <fieldset><legend>Avisarme por WhatsApp</legend>{REMINDER_CHOICES.map((choice) => <label key={choice.minutes} className="pn-check"><input type="checkbox" checked={draft.reminderMinutes.includes(choice.minutes)} onChange={(event) => setDraft({ ...draft, reminderMinutes: event.target.checked ? [...draft.reminderMinutes, choice.minutes] : draft.reminderMinutes.filter((value) => value !== choice.minutes) })} /> {choice.label}</label>)}</fieldset>
        <label>Notas<textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} maxLength={4000} rows={3} /></label>
        {draft.kind === "lectura" ? <div className="pn-row"><label>Avance<input type="number" min={0} value={draft.progressCurrent} onChange={(event) => setDraft({ ...draft, progressCurrent: Number(event.target.value) })} /></label><label>Total<input type="number" min={0} value={draft.progressTotal} onChange={(event) => setDraft({ ...draft, progressTotal: Number(event.target.value) })} /></label><label>Unidad<select value={draft.progressUnit} onChange={(event) => setDraft({ ...draft, progressUnit: event.target.value as ProgressUnit })}><option value="paginas">Páginas</option><option value="minutos">Minutos</option><option value="capitulos">Capítulos</option><option value="porcentaje">Porcentaje</option></select></label></div> : null}
      </div> : null}
      {error ? <p className="pn-error" role="alert">{error}</p> : null}
      {notice ? <p className="pn-ok">{notice}</p> : null}
      <div className="pn-row">
        <button className="pn-button" type="submit" disabled={busy}>{busy ? "Guardando…" : draft.id ? "Guardar cambios" : "Agregar"}</button>
        {draft.id ? <button className="pn-ghost" type="button" onClick={() => { setDraft(emptyDraft()); setMore(false); }}>Cancelar</button> : null}
      </div>
    </form>
    <div className="pn-tabs" role="tablist">
      {([["agenda", "Agenda"], ["repasos", "Repasos"], ["lecturas", "Lecturas"], ["todo", "Todo"]] as const).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "is-on" : ""} onClick={() => setTab(id)}>{label}</button>)}
    </div>
    {tab === "agenda" ? <Agenda items={items} onEdit={edit} onChanged={refresh} /> : null}
    {tab === "repasos" ? <ul className="pn-list">{reviews.map((item) => <ReviewCard key={item.id} item={item} onChanged={refresh} />)}{reviews.length ? null : <p className="pn-muted">Crea un repaso y repítelo con los botones. Otra vez lo regresa a mañana; Bien y Fácil lo espacían.</p>}</ul> : null}
    {tab === "lecturas" ? <ul className="pn-list">{readings.map((item) => <ReadingCard key={item.id} item={item} onChanged={refresh} />)}{readings.length ? null : <p className="pn-muted">Aquí van libros y audiolibros, con páginas o minutos.</p>}</ul> : null}
    {tab === "todo" ? <ul className="pn-list">{items.map((item) => <ItemCard key={item.id} item={item} onEdit={edit} onChanged={refresh} />)}</ul> : null}
    <section className="pn-card">
      <h2>Calendario y WhatsApp</h2>
      <p>Suscribe este calendario privado en Google Calendar, Apple o Outlook. El enlace es secreto: no lo publiques.</p>
      {bundle?.calendarUrl ? <p><a href={bundle.calendarUrl}>{bundle.calendarUrl}</a></p> : <p className="pn-muted">Falta PERSONAL_ICS_TOKEN o PERSONAL_PUBLIC_URL. La guía está en ESPACIO-PERSONAL.md.</p>}
      {bundle?.calendarUrl ? <button type="button" className="pn-ghost" onClick={() => navigator.clipboard.writeText(bundle.calendarUrl ?? "")}>Copiar enlace</button> : null}
      <p>WhatsApp: {bundle?.whatsapp.ready ? `listo (${bundle.whatsapp.provider})` : "sin configurar"}. {bundle?.whatsapp.inbound ? "También puedes escribirle al número para anotar o preguntar qué hay esta semana." : "Los mensajes de entrada se activan con la API de Meta o Twilio."}</p>
      <div className="pn-row">
        <button type="button" className="pn-button" onClick={() => sendPersonalTest().then(() => setNotice("Mensaje de prueba enviado.")).catch((cause) => setError(messageOf(cause)))}>Enviar mensaje de prueba</button>
        <button type="button" className="pn-ghost" onClick={() => runPersonalReminders().then((result) => setNotice(result.note ?? `Enviados: ${result.sent}. Fallos: ${result.failed}.`)).catch((cause) => setError(messageOf(cause)))}>Enviar pendientes ahora</button>
      </div>
      {portalUrl ? <p className="pn-muted"><a href={portalUrl}>Volver al portal del grupo</a></p> : null}
    </section>
  </div>;
}

function Agenda({ items, onEdit, onChanged }: { items: PersonalItem[]; onEdit: (item: PersonalItem) => void; onChanged: () => Promise<void> }) {
  const now = new Date();
  const start = startOfMexicoDay(now).getTime();
  const week = endOfMexicoWeek(now).getTime();
  const groups = [
    ["Hoy", items.filter((item) => inRange(item, start, start + 86_400_000))],
    ["Esta semana", items.filter((item) => inRange(item, start + 86_400_000, week))],
    ["Después", items.filter((item) => { const time = stamp(item); return time !== null && time >= week; })],
    ["Sin fecha", items.filter((item) => stamp(item) === null)],
  ] as const;
  return <div>{groups.map(([label, rows]) => <section key={label}><h2 className="pn-group">{label}</h2>{rows.length ? <ul className="pn-list">{rows.map((item) => <ItemCard key={item.id} item={item} onEdit={onEdit} onChanged={onChanged} />)}</ul> : <p className="pn-muted">Nada en {label.toLowerCase()}.</p>}</section>)}</div>;
}

function inRange(item: PersonalItem, from: number, until: number): boolean {
  const time = stamp(item);
  return time !== null && time >= from && time < until && item.status !== "archivado";
}
function stamp(item: PersonalItem): number | null {
  const anchor = anchorOf(item);
  if (!anchor) return null;
  const time = new Date(anchor).getTime();
  return Number.isFinite(time) ? time : null;
}

function ItemCard({ item, onEdit, onChanged }: { item: PersonalItem; onEdit: (item: PersonalItem) => void; onChanged: () => Promise<void> }) {
  const google = googleCalendarLink(item);
  const overdue = item.status === "pendiente" && (stamp(item) ?? Infinity) < startOfMexicoDay().getTime();
  return <li className={`pn-item ${item.priority === "critico" ? "is-critical" : ""} ${overdue ? "is-overdue" : ""} ${item.status === "hecho" ? "is-done" : ""}`}>
    <div><span className="pn-kind">{KIND_LABEL[item.kind]}</span> {item.priority !== "normal" ? <span className="pn-flag">{item.priority === "critico" ? "Muy importante" : "Importante"}</span> : null}</div>
    <h3>{item.title}</h3>
    <p>{formatMexico(anchorOf(item), item.allDay)}{item.subject ? ` · ${item.subject}` : ""}</p>
    {item.location ? <p>{item.location}</p> : null}
    {item.url ? <p><a href={item.url}>Abrir enlace</a></p> : null}
    <div className="pn-actions">
      {item.status === "pendiente" ? <button type="button" onClick={() => setPersonalStatus({ data: { id: item.id, status: "hecho" } }).then(onChanged)}>Hecho</button> : <button type="button" onClick={() => setPersonalStatus({ data: { id: item.id, status: "pendiente" } }).then(onChanged)}>Reabrir</button>}
      <button type="button" onClick={() => onEdit(item)}>Editar</button>
      {google ? <a href={google} target="_blank" rel="noreferrer">Google Calendar</a> : null}
      <button type="button" onClick={() => { if (window.confirm("¿Eliminar esta entrada?")) deletePersonal({ data: { id: item.id } }).then(onChanged); }}>Eliminar</button>
    </div>
  </li>;
}

function ReviewCard({ item, onChanged }: { item: PersonalItem; onChanged: () => Promise<void> }) {
  const state = { ease: item.ease, intervalDays: item.intervalDays, repetitions: item.repetitions };
  return <li className="pn-item">
    <h3>{item.title}</h3>
    <p>Siguiente: {formatMexico(item.nextReviewAt, true)} · {item.subject}</p>
    <div className="pn-actions">{(["otra", "dificil", "bien", "facil"] as const).map((grade) => <button key={grade} type="button" onClick={() => reviewPersonal({ data: { id: item.id, grade } }).then(onChanged)}>{grade === "otra" ? "Otra vez" : grade === "dificil" ? "Difícil" : grade === "bien" ? "Bien" : "Fácil"} · {intervalLabel(applyReview(state, grade).intervalDays)}</button>)}</div>
  </li>;
}

function ReadingCard({ item, onChanged }: { item: PersonalItem; onChanged: () => Promise<void> }) {
  const total = item.progressUnit === "porcentaje" ? 100 : item.progressTotal;
  const pct = total > 0 ? Math.min(100, Math.round((item.progressCurrent / total) * 100)) : 0;
  return <li className="pn-item">
    <h3>{item.title}</h3>
    <p>{item.progressCurrent} / {total || "?"} {item.progressUnit}</p>
    <div className="pn-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
    <form className="pn-row" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); progressPersonal({ data: { id: item.id, current: Number(data.get("current")) } }).then(onChanged); }}>
      <label>Nuevo avance<input name="current" type="number" min={0} defaultValue={item.progressCurrent} /></label>
      <button className="pn-button" type="submit">Actualizar</button>
    </form>
  </li>;
}
