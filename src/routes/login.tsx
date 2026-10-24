import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AUTH_PROVIDERS, authClient, authEnabled, googleAuthEnabled, signIn } from "@/lib/auth/client";
import { readShell } from "@/lib/personal/shell";
import { Button, Field, Input } from "@/components/ui";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({ mode: search.mode === "alta" ? ("alta" as const) : ("entrar" as const) }),
  loader: () => readShell(),
  component: Login,
});

function Login() {
  const { personal } = Route.useLoaderData();
  const next = personal ? "/" : "/registro";
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"entrar" | "alta">(personal ? "entrar" : initialMode);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => setHydrated(true), []);

  async function onEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    if (!email || password.length < 8) {
      setError("Usa un correo y una clave de al menos 8 caracteres.");
      return;
    }
    setPending(true);
    try {
      if (!personal && mode === "alta") {
        const result = await authClient.signUp.email({ email, password, name: email.split("@")[0] || "Alumno", callbackURL: next });
        if (result.error) throw new Error(result.error.message || "No se pudo dar de alta");
      } else {
        const result = await authClient.signIn.email({ email, password, callbackURL: next });
        if (result.error) throw new Error(result.error.message || "No se pudo entrar");
      }
      window.location.assign(next);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Revisa el correo y la clave.";
      setError(/invalid email or password/i.test(message) ? "Correo o contraseña incorrectos. Puedes mostrar la clave para comprobar lo que escribiste." : message);
      setPending(false);
    }
  }

  return <main className="grid min-h-dvh place-items-center bg-bg px-4 text-ink"><div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface shadow-card"><div className="fd-login-heading flex items-center justify-between border-b border-line px-6 py-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">{personal ? "pnota.com" : "Facultad de Derecho"}</p><p className="mt-0.5 text-[11px] text-muted">{personal ? "Espacio personal del titular" : "Comunidad académica · Grupo 9114"}</p></div><img src="/brand/justicia-emblema.webp" alt="" className="fd-login-emblem" width="59" height="78"/></div><div className="p-6"><p className="text-xs font-medium uppercase tracking-[0.16em] text-clay">{personal ? "Solo el titular" : "Facultad de Derecho · Grupo 9114"}</p><h1 className="mt-2 font-display text-4xl">{personal ? "Entrar a tu espacio" : "Entrar al portal"}</h1><p className="mt-2 text-sm text-muted">{personal ? "Usa el mismo correo con el que entras al portal del grupo. Otra cuenta no puede ver estos datos." : "El registro de alumnos, cátedras y moderadores pide cuenta. El mural se puede leer sin entrar."}</p>{!personal && authEnabled && googleAuthEnabled ? <div className="mt-6 grid gap-2">{AUTH_PROVIDERS.map((provider) => <button key={provider.providerId} type="button" onClick={() => signIn(provider.providerId, { callbackURL: next })} className="min-h-11 rounded-md border border-forest/20 bg-forest px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-forest-deep">Continuar con {provider.label}</button>)}</div> : null}<div className="mt-6 border-t border-line pt-5">{personal ? null : <div className="mb-3 flex gap-2"><button type="button" onClick={() => { setMode("entrar"); setShowPassword(false); }} className={mode === "entrar" ? "text-sm font-medium text-forest" : "text-sm text-muted"}>Correo</button><span className="text-muted">·</span><button type="button" onClick={() => { setMode("alta"); setShowPassword(false); }} className={mode === "alta" ? "text-sm font-medium text-forest" : "text-sm text-muted"}>Alta nueva</button></div>}<form className="grid gap-3" method="post" action="/login" onSubmit={onEmail}><Field label="Correo"><Input name="email" type="email" required placeholder="nombre@correo.com" autoComplete="username" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} className="text-base sm:text-sm"/></Field><Field label="Clave"><div className="relative"><Input name="password" type={showPassword ? "text" : "password"} required minLength={8} autoComplete={mode === "alta" ? "new-password" : "current-password"} autoCapitalize="none" autoCorrect="off" spellCheck={false} className="pr-14 text-base sm:text-sm"/><button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword} className="absolute inset-y-0 right-1 flex min-h-11 w-12 items-center justify-center rounded-md text-ink-soft hover:bg-forest/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-forest" onClick={(event) => { event.stopPropagation(); setShowPassword((current) => !current); }}>{showPassword ? <EyeOff size={20} aria-hidden="true"/> : <Eye size={20} aria-hidden="true"/>}</button></div></Field>{error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}<Button type="submit" disabled={pending || !hydrated}>{pending ? "Espera…" : personal || mode === "entrar" ? "Entrar" : "Crear cuenta"}</Button></form></div><Link to="/" className="mt-6 inline-block text-sm font-medium text-forest">Volver al inicio</Link><p className="mt-4 text-xs text-muted">{personal ? "Las tareas, exámenes y recordatorios de este espacio no se comparten con el grupo." : "Portal estudiantil independiente. No es un sitio oficial de la UNAM."}</p></div></div></main>;
}
