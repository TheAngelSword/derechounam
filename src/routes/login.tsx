import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AUTH_PROVIDERS, authClient, authEnabled, googleAuthEnabled, signIn } from "@/lib/auth/client";
import { Button, Field, Input } from "@/components/ui";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [mode, setMode] = useState<"entrar" | "alta">("entrar");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();
    if (!email || password.length < 8) {
      setError("Usa un correo y una clave de al menos 8 caracteres.");
      return;
    }
    setPending(true);
    try {
      if (mode === "alta") {
        const result = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0] || "Alumno",
          callbackURL: "/registro",
        });
        if (result.error) throw new Error(result.error.message || "No se pudo dar de alta");
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/registro",
        });
        if (result.error) throw new Error(result.error.message || "No se pudo entrar");
      }
      window.location.assign("/registro");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revisa el correo y la clave.");
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4 text-ink">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-line bg-surface-strong px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">Facultad de Derecho</p>
            <p className="mt-0.5 text-[11px] text-muted">Comunidad académica · Grupo 9114</p>
          </div>
          <img src="/unam-logo.png" alt="Universidad Nacional Autónoma de México" className="h-16 w-auto object-contain" />
        </div>
        <div className="p-6">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-clay">Atrio · Grupo 9114</p>
        <h1 className="mt-2 font-display text-4xl">Entrar al atrio</h1>
        <p className="mt-2 text-sm text-muted">
          El registro de alumnos, cátedras y moderadores pide cuenta. El mural se puede leer sin entrar.
        </p>

        {authEnabled && googleAuthEnabled ? (
          <div className="mt-6 grid gap-2">
            {AUTH_PROVIDERS.map((provider) => (
              <button
                key={provider.providerId}
                type="button"
                onClick={() => signIn(provider.providerId, { callbackURL: "/registro" })}
                className="min-h-11 rounded-md border border-forest/20 bg-forest px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-forest-deep"
              >
                Continuar con {provider.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-6 border-t border-line pt-5">
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("entrar")}
              className={mode === "entrar" ? "text-sm font-medium text-forest" : "text-sm text-muted"}
            >
              Correo
            </button>
            <span className="text-muted">·</span>
            <button
              type="button"
              onClick={() => setMode("alta")}
              className={mode === "alta" ? "text-sm font-medium text-forest" : "text-sm text-muted"}
            >
              Alta nueva
            </button>
          </div>
          <form className="grid gap-3" onSubmit={onEmail}>
            {mode === "alta" ? (
              <Field label="Cómo te conocen en clase">
                <Input name="name" placeholder="Mesa 9114" />
              </Field>
            ) : null}
            <Field label="Correo">
              <Input name="email" type="email" required placeholder="nombre@correo.com" />
            </Field>
            <Field label="Clave">
              <Input name="password" type="password" required minLength={8} />
            </Field>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Espera…" : mode === "alta" ? "Crear cuenta" : "Entrar"}
            </Button>
          </form>
        </div>

        <Link to="/" className="mt-6 inline-block text-sm font-medium text-forest">
          Volver al inicio
        </Link>
        </div>
      </div>
    </main>
  );
}
