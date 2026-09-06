import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { Button, Card, Field, FormBox, Input, Pill, Select } from "@/components/ui";
import { useDirectory, useInvalidateDirectory } from "@/components/directory";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  AREAS,
  assignAreaMod,
  registerMember,
  revokeAreaMod,
  setMemberRole,
  setMemberStatus,
} from "@/lib/members";

export const Route = createFileRoute("/registro")({ component: RegistroPage });

function RegistroPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-muted">
        <p>Comprobando acceso…</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <RegistroBody />;
}

function RegistroBody() {
  const { directory, isLoading, reload } = useDirectory();
  const invalidate = useInvalidateDirectory();
  const [error, setError] = useState<string | null>(null);

  async function onRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      await registerMember({
        data: {
          alias: String(data.get("alias") ?? ""),
        },
      });
      await invalidate();
      await reload();
    } catch {
      setError("El alias debe tener al menos dos caracteres.");
    }
  }

  const me = directory?.me ?? null;
  const isMod = me?.role === "moderador" && me.status === "activo";
  const alumnos = directory?.members.filter((item) => item.role === "alumno") ?? [];
  const profesores = directory?.members.filter((item) => item.role === "profesor") ?? [];
  const moderadores = directory?.members.filter((item) => item.role === "moderador") ?? [];

  return (
    <Shell
      eyebrow="Acceso del grupo 9114"
      title="Acceso ordenado para la comunidad 9114."
      lead="Las cuentas nuevas entran como alumnos pendientes. Moderación activa el acceso y, cuando corresponde, asigna el rol de profesor."
    >
      {isLoading ? <p className="text-sm text-muted">Cargando el padrón…</p> : null}

      {!me ? (
        <FormBox title="Alta en el padrón" onSubmit={onRegister}>
          <Field label="Alias en clase">
            <Input name="alias" required maxLength={40} placeholder="Mesa 9114" />
          </Field>
          <div className="rounded-lg border border-forest/10 bg-forest-soft p-3 text-sm text-forest-deep">
            Tu solicitud se registrará como <strong>alumno pendiente</strong>. Un moderador puede activarla y cambiar el rol a profesor cuando corresponda.
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit">Solicitar acceso</Button>
        </FormBox>
      ) : (
        <Card className="mb-6">
          <Pill>{me.role}</Pill>
          <p className="mt-2 font-display text-2xl">{me.alias}</p>
          <p className="mt-1 text-sm text-muted">
            Grupo {me.groupCode} · {me.status}
          </p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Roster title="Alumnos" rows={alumnos} isMod={isMod} onChange={invalidate} />
        <Roster title="Profesores" rows={profesores} isMod={isMod} onChange={invalidate} />
        <Roster title="Moderadores" rows={moderadores} isMod={isMod} onChange={invalidate} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-2xl">Moderadores por área</h2>
          <ul className="mt-4 grid gap-3">
            {AREAS.map((area) => {
              const assigned = directory?.mods.filter((item) => item.area === area.id) ?? [];
              return (
                <li key={area.id} className="border-b border-line pb-3 last:border-0">
                  <p className="font-medium">{area.label}</p>
                  <p className="mt-1 text-sm text-muted">
                    {assigned.length ? assigned.map((item) => item.alias).join(" · ") : "Sin asignar"}
                  </p>
                  {isMod && directory ? (
                    <form
                      className="mt-2 flex flex-wrap gap-2"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        const userId = String(form.get("userId") ?? "");
                        if (!userId) return;
                        await assignAreaMod({ data: { userId, area: area.id } });
                        await invalidate();
                      }}
                    >
                      <Select name="userId" className="min-h-11 flex-1">
                        <option value="">Elegir del padrón</option>
                        {directory.members
                          .filter((item) => item.status === "activo")
                          .map((item) => (
                            <option key={item.userId} value={item.userId}>
                              {item.alias}
                            </option>
                          ))}
                      </Select>
                      <Button type="submit" variant="line">
                        Asignar
                      </Button>
                    </form>
                  ) : null}
                  {isMod
                    ? assigned.map((item) => (
                        <button
                          key={`${item.userId}-${item.area}`}
                          type="button"
                          className="mt-2 mr-2 text-xs text-muted underline"
                          onClick={async () => {
                            await revokeAreaMod({ data: { userId: item.userId, area: area.id } });
                            await invalidate();
                          }}
                        >
                          Retirar {item.alias}
                        </button>
                      ))
                    : null}
                </li>
              );
            })}
          </ul>
        </Card>

        {isMod ? <Card>
          <h2 className="font-display text-2xl">Bitácora de accesos</h2>
          <ul className="mt-4 grid gap-3">
            {(directory?.access ?? []).map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{entry.alias}</p>
                  <p className="text-muted">
                    {entry.action} · {entry.area}
                  </p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted">
                  {String(entry.createdAt).slice(11, 16) || "—"}
                </span>
              </li>
            ))}
            {!directory?.access.length ? <li className="text-sm text-muted">Todavía no hay entradas.</li> : null}
          </ul>
          <Link to="/" className="mt-4 inline-block text-sm text-forest">
            Volver al inicio
          </Link>
        </Card> : <Card>
          <h2 className="font-display text-2xl">Privacidad del grupo</h2>
          <p className="mt-2 text-sm text-muted">La bitácora detallada de accesos está reservada a moderación.</p>
        </Card>}
      </div>
    </Shell>
  );
}

function Roster({
  title,
  rows,
  isMod,
  onChange,
}: {
  title: string;
  rows: Array<{ userId: string; alias: string; role: "alumno" | "profesor" | "moderador"; status: string }>;
  isMod: boolean;
  onChange: () => void;
}) {
  return (
    <Card>
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-1 text-sm text-muted">{rows.length} en el padrón</p>
      <ul className="mt-4 grid gap-3">
        {rows.map((row) => (
          <li key={row.userId} className="border-b border-line pb-3 last:border-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{row.alias}</p>
              <Pill>{row.status}</Pill>
            </div>
            {isMod ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-xs text-forest underline"
                  onClick={async () => {
                    await setMemberStatus({
                      data: { userId: row.userId, status: row.status === "activo" ? "suspendido" : "activo" },
                    });
                    onChange();
                  }}
                >
                  {row.status === "activo" ? "Suspender" : "Activar"}
                </button>
                {row.role !== "moderador" ? (
                  <button
                    type="button"
                    className="text-xs text-forest underline"
                    onClick={async () => {
                      await setMemberRole({ data: { userId: row.userId, role: "moderador" } });
                      onChange();
                    }}
                  >
                    Hacer moderador
                  </button>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
        {!rows.length ? <li className="text-sm text-muted">Nadie todavía.</li> : null}
      </ul>
    </Card>
  );
}
