import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Camera,
  ClipboardCheck,
  Headphones,
  Megaphone,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";
import { Shell } from "@/components/shell";
import { Card, Pill } from "@/components/ui";
import { useBoard } from "@/components/board-context";
import { formatLongDate } from "@/lib/format";

export const Route = createFileRoute("/")({ component: Home });

type ActivityPath = "/biblioteca" | "/catedras" | "/tareas" | "/servicios" | "/agenda" | "/bitacora" | "/mural";

type ActivityItem = {
  id: string;
  title: string;
  subtitle?: string;
  detail?: string;
  dateLabel?: string;
  sortValue: number;
};

type ActivitySection = {
  key: string;
  label: string;
  hint: string;
  to: ActivityPath;
  icon: LucideIcon;
  items: ActivityItem[];
  latestAt: number;
};

function timeValue(value: string | undefined | null) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function excerpt(value: string | undefined | null, max = 115) {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length <= max ? clean : `${clean.slice(0, max).trimEnd()}…`;
}

function newest(items: ActivityItem[]) {
  return [...items].sort((a, b) => b.sortValue - a.sortValue).slice(0, 3);
}

function Home() {
  const board = useBoard();

  const audioItems = newest(board.materials.filter((material) => Boolean(material.audioUrl)).map((material) => ({
    id: `audio-${material.id}`,
    title: material.audioLabel || material.title,
    subtitle: `${material.courseName} · ${material.professorName}`,
    detail: excerpt(material.body),
    dateLabel: formatLongDate(material.classDate),
    sortValue: timeValue(material.createdAt),
  })));

  const bookItems = newest(board.books.map((book) => ({
    id: `book-${book.id}`,
    title: book.title,
    subtitle: book.author,
    detail: excerpt(book.notes),
    dateLabel: book.kind,
    sortValue: timeValue(book.createdAt) || book.id,
  })));

  const taskItems = newest(board.tasks.map((task) => ({
    id: `task-${task.id}`,
    title: task.title,
    subtitle: `${task.professorName} · ${task.courseName}`,
    detail: excerpt(task.instructions),
    dateLabel: `Entrega ${formatLongDate(task.dueDate)}`,
    sortValue: timeValue(task.createdAt),
  })));

  const serviceItems = newest(board.services.map((service) => ({
    id: `service-${service.id}`,
    title: service.title,
    subtitle: `${service.category} · ${service.priceText}`,
    detail: excerpt(service.description),
    dateLabel: service.availabilityDays,
    sortValue: timeValue(service.createdAt),
  })));

  const agendaItems = newest(board.events.map((event) => ({
    id: `event-${event.id}`,
    title: event.title,
    subtitle: `${event.kind} · ${event.place}`,
    detail: excerpt(event.description),
    dateLabel: formatLongDate(event.eventDate),
    sortValue: timeValue(event.createdAt) || timeValue(event.eventDate),
  })));

  const bitacoraItems = newest(board.posts.map((post) => ({
    id: `post-${post.id}`,
    title: post.title,
    subtitle: post.place || post.authorAlias,
    detail: excerpt(post.body),
    dateLabel: post.shotDate ? formatLongDate(post.shotDate) : "Bitácora",
    sortValue: timeValue(post.createdAt),
  })));

  const noticeItems = newest(board.notices.map((notice) => ({
    id: `notice-${notice.id}`,
    title: notice.title,
    subtitle: notice.pinned ? "Aviso fijo" : "Aviso",
    detail: excerpt(notice.body),
    dateLabel: notice.pinned ? "Fijo" : "Mural",
    sortValue: timeValue(notice.createdAt),
  })));

  const candidates: ActivitySection[] = [
    { key: "audios", label: "Audios", hint: "Material para escuchar", to: "/catedras", icon: Headphones, items: audioItems, latestAt: audioItems[0]?.sortValue ?? 0 },
    { key: "libros", label: "Libros", hint: "Bibliografía y documentos", to: "/biblioteca", icon: BookOpen, items: bookItems, latestAt: bookItems[0]?.sortValue ?? 0 },
    { key: "tareas", label: "Trabajos y tareas", hint: "Entregas del grupo", to: "/tareas", icon: ClipboardCheck, items: taskItems, latestAt: taskItems[0]?.sortValue ?? 0 },
    { key: "servicios", label: "Servicios", hint: "Comida, encargos y ventas", to: "/servicios", icon: ShoppingBasket, items: serviceItems, latestAt: serviceItems[0]?.sortValue ?? 0 },
    { key: "agenda", label: "Actividades", hint: "Agenda del grupo 9114", to: "/agenda", icon: CalendarDays, items: agendaItems, latestAt: agendaItems[0]?.sortValue ?? 0 },
    { key: "bitacora", label: "Bitácora", hint: "Fotos y evidencias de clase", to: "/bitacora", icon: Camera, items: bitacoraItems, latestAt: bitacoraItems[0]?.sortValue ?? 0 },
    { key: "mural", label: "Mural", hint: "Avisos del grupo", to: "/mural", icon: Megaphone, items: noticeItems, latestAt: noticeItems[0]?.sortValue ?? 0 },
  ];

  const sections = candidates
    .filter((section) => section.items.length > 0)
    .sort((a, b) => b.latestAt - a.latestAt)
    .slice(0, 5);

  return (
    <Shell
      eyebrow="Grupo 9114 · primer semestre"
      title="Las últimas actividades"
      lead="Lo más reciente del portal en un solo lugar: audios, libros, tareas, servicios, agenda, bitácora y avisos. Se muestran como máximo cinco categorías, con las últimas tres publicaciones de cada una."
    >
      <Card className="unam-hero-card hero-glow mb-7" interactive>
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-bg/60">Actividad reciente · Grupo 9114</p>
            <h2 className="mt-2 font-display text-3xl">Qué se ha movido recientemente.</h2>
            <p className="mt-2 max-w-2xl text-sm text-bg/72">Cada bloque te lleva directamente a su sección. Cuando alguien publique un audio, libro, tarea, servicio, actividad, foto o aviso, la portada se actualiza automáticamente.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
            <HeroStat value={board.materials.filter((material) => Boolean(material.audioUrl)).length} label="audios" />
            <HeroStat value={board.books.length} label="libros" />
            <HeroStat value={board.tasks.length} label="tareas" />
          </div>
        </div>
      </Card>

      {sections.length ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {sections.map((section) => (
            <ActivityPanel key={section.key} section={section} />
          ))}
        </div>
      ) : (
        <Card>
          <p className="font-display text-2xl">Todavía no hay actividad publicada.</p>
          <p className="mt-2 text-sm text-muted">En cuanto se agregue material en las distintas áreas, aparecerá aquí.</p>
        </Card>
      )}
    </Shell>
  );
}

function ActivityPanel({ section }: { section: ActivitySection }) {
  const Icon = section.icon;
  return (
    <Card interactive className="flex min-h-full flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-forest-soft text-forest"><Icon className="size-5" /></span>
          <div>
            <p className="font-display text-2xl">{section.label}</p>
            <p className="text-xs text-muted">{section.hint}</p>
          </div>
        </div>
        <Pill tone="forest">{section.items.length} recientes</Pill>
      </div>

      <div className="divide-y divide-line">
        {section.items.map((item) => (
          <article key={item.id} className="py-4 first:pt-5 last:pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-ink">{item.title}</h3>
              {item.dateLabel ? <span className="text-xs text-clay">{item.dateLabel}</span> : null}
            </div>
            {item.subtitle ? <p className="mt-1 text-xs font-medium text-forest">{item.subtitle}</p> : null}
            {item.detail ? <p className="mt-2 text-sm leading-relaxed text-muted">{item.detail}</p> : null}
          </article>
        ))}
      </div>

      <Link to={section.to} className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-forest">
        Ver sección <ArrowRight className="size-4" />
      </Link>
    </Card>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.07] px-4 py-3">
      <p className="font-display text-3xl leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-bg/55">{label}</p>
    </div>
  );
}
