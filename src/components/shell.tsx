import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Camera,
  CarFront,
  GraduationCap,
  Landmark,
  LayoutGrid,
  Megaphone,
  Menu,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/components/ui";

const NAV = [
  { to: "/", label: "Inicio", icon: LayoutGrid },
  { to: "/clases", label: "Horarios", icon: GraduationCap },
  { to: "/catedras", label: "Cátedras", icon: Landmark },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/biblioteca", label: "Libros", icon: BookOpen },
  { to: "/bitacora", label: "Bitácora", icon: Camera },
  { to: "/rutas", label: "Rutas", icon: CarFront },
  { to: "/mesas", label: "Mesas", icon: Users },
  { to: "/mural", label: "Mural", icon: Megaphone },
  { to: "/registro", label: "Registro", icon: Shield },
  { to: "/control", label: "Control", icon: SlidersHorizontal },
] as const;

const MOBILE_PRIMARY = NAV.filter((item) => ["/", "/clases", "/biblioteca", "/bitacora"].includes(item.to));
const MOBILE_MORE = NAV.filter((item) => !MOBILE_PRIMARY.some((primary) => primary.to === item.to));

export function Shell({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isPending } = useCurrentUserState();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MOBILE_MORE.some((item) => item.to === pathname);

  return (
    <div className="min-h-dvh bg-transparent text-ink">
      <div className="mx-auto flex max-w-7xl gap-0 lg:gap-8 xl:gap-12">
        <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-line/80 px-5 py-7 lg:flex">
          <Brand />
          <div className="hero-glow mt-6 rounded-[1.6rem] border border-forest/10 bg-forest px-5 py-5 text-bg shadow-float">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-bg/70">
              <Sparkles className="size-3.5" />
              Grupo activo
            </div>
            <p className="mt-2 font-display text-2xl">9114 · Derecho</p>
            <p className="mt-1 text-sm text-bg/70">Primer semestre · Facultad de Derecho</p>
          </div>

          <nav className="stagger-children mt-7 grid gap-1.5" aria-label="Navegación principal">
            {NAV.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-all duration-250",
                    active
                      ? "bg-forest text-bg shadow-[0_18px_38px_-28px_rgba(0,61,121,0.9)]"
                      : "text-ink-soft hover:translate-x-1 hover:bg-white hover:shadow-sm",
                  )}
                >
                  <item.icon className={cn("size-4 transition-transform duration-250", active ? "scale-105" : "group-hover:-rotate-3")} strokeWidth={1.8} />
                  <span>{item.label}</span>
                  {active ? <span className="ml-auto size-1.5 rounded-full bg-clay-soft animate-pulse" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto grid gap-3 pt-4">
            <AuthSlot pending={isPending} />
            <p className="text-xs leading-relaxed text-muted">Comunidad académica privada · grupo 9114</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-2 lg:pb-12 lg:pt-8 xl:pr-6">
          <header className="mb-8 flex items-start justify-between gap-4 lg:hidden">
            <Brand compact />
            <AuthSlot pending={isPending} compact />
          </header>
          <header className="mb-8 max-w-4xl soft-enter">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-px w-8 bg-clay" />
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-clay">{eyebrow}</p>
            </div>
            <h1 className="font-display text-4xl leading-[1.03] tracking-[-0.03em] text-ink sm:text-5xl xl:text-[3.55rem]">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-[1.02rem]">{lead}</p>
          </header>
          <main className="soft-enter">{children}</main>
        </div>
      </div>

      {moreOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
            onClick={() => setMoreOpen(false)}
          />
          <div className="glass-panel absolute inset-x-3 bottom-20 rounded-2xl border border-line p-4 shadow-float float-in">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-display text-xl">Más del grupo 9114</p>
                <p className="text-xs text-muted">Herramientas y áreas académicas</p>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="grid size-10 place-items-center rounded-full bg-bg-warm text-muted"
                aria-label="Cerrar"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MOBILE_MORE.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex min-h-14 items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-all duration-200",
                      active ? "border-forest bg-forest text-bg" : "border-line bg-surface text-ink-soft hover:-translate-y-0.5",
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <nav className="glass-panel fixed inset-x-0 bottom-0 z-50 border-t border-line/90 px-2 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-1 lg:hidden" aria-label="Navegación móvil">
        <div className="grid grid-cols-5">
          {MOBILE_PRIMARY.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-semibold transition-all duration-200",
                  active ? "bg-forest-soft text-forest-deep" : "text-muted hover:bg-white/60",
                )}
              >
                <item.icon className="size-[18px]" strokeWidth={1.8} />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((value) => !value)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-semibold transition-all duration-200",
              moreOpen || moreActive ? "bg-forest-soft text-forest-deep" : "text-muted hover:bg-white/60",
            )}
          >
            <Menu className="size-[18px]" strokeWidth={1.8} />
            Más
          </button>
        </div>
      </nav>
    </div>
  );
}

function AuthSlot({ pending, compact = false }: { pending: boolean; compact?: boolean }) {
  if (pending) {
    return <div className="h-9 w-24 animate-pulse rounded-md bg-bg-warm" />;
  }
  return (
    <div className={cn("grid gap-1", compact && "justify-items-end")}>
      <SignedIn>
        <div className={cn(compact && "scale-90 origin-top-right")}>
          <UserButton />
        </div>
      </SignedIn>
      <SignedOut>
        <Link to="/login" className="rounded-md border border-line bg-surface px-3 py-2 text-sm font-semibold text-forest shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          Entrar
        </Link>
      </SignedOut>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={cn("group block rounded-2xl border border-line/80 bg-surface px-4 py-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float", compact && "px-3 py-3")}>
      <div className="flex items-center gap-3">
        <img
          src="/unam-logo.png"
          alt="Logo de la UNAM"
          className={cn("w-14 shrink-0 object-contain", compact ? "h-14" : "h-16")}
        />
        <div className={cn("leading-tight", compact && "text-sm")}>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-forest">UNAM</span>
          <span className="mt-1 block font-display text-[1.28rem] tracking-tight text-ink">Facultad de Derecho</span>
          <span className="mt-1 block text-xs text-muted">Grupo 9114 · Comunidad académica</span>
        </div>
      </div>
    </Link>
  );
}
