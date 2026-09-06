import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Pencil, UserPlus, UsersRound, X, XCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useRefreshBoard } from "@/components/board-context";
import { Button, Card, Field, FormBox, Input, Pill, Select, Textarea, cn } from "@/components/ui";
import { PublishGate } from "@/components/publish-gate";
import { canEditPublication, useAreaVisit, useDirectory } from "@/components/directory";
import { addRide, cancelRideSeat, requestRideSeat, updateRide } from "@/lib/content";
import type { RideItem } from "@/lib/types";

export const Route = createFileRoute("/rutas")({ component: RutasPage });

function RutasPage() {
  const { rides } = useBoard();
  const refresh = useRefreshBoard();
  const { user, directory } = useDirectory();
  useAreaVisit("rutas");

  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<RideItem | null>(null);
  const [requestingId, setRequestingId] = useState<number | null>(null);

  function read(fd: FormData) {
    const seats = Number(fd.get("seats") ?? 2);
    return {
      direction: String(fd.get("direction") ?? "Ida") as "Ida",
      fromPlace: String(fd.get("fromPlace") ?? "").trim(),
      toPlace: String(fd.get("toPlace") ?? "").trim(),
      weekday: String(fd.get("weekday") ?? "Lunes") as "Lunes",
      timeSlot: String(fd.get("timeSlot") ?? "").trim(),
      seats: Number.isFinite(seats) ? Math.min(6, Math.max(1, seats)) : 2,
      notes: String(fd.get("notes") ?? "").trim(),
      ownerAlias: String(fd.get("ownerAlias") ?? "").trim(),
    };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    try {
      await addRide({ data: read(new FormData(form)) });
      form.reset();
      await refresh();
    } catch {
      setError("Entra al padrón para publicar.");
    }
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setError(null);
    try {
      await updateRide({ data: { id: editing.id, ...read(new FormData(event.currentTarget)) } });
      setEditing(null);
      await refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo guardar.";
      setError(
        /autor de la publicación|administrador/i.test(message)
          ? "Sólo el autor o un administrador puede editar esta ruta."
          : message,
      );
    }
  }

  async function requestSeat(rideId: number) {
    setError(null);
    setRequestingId(rideId);
    try {
      await requestRideSeat({ data: { rideId } });
      await refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo pedir el asiento.";
      if (/padrón|acceso/i.test(message)) setError("Tu cuenta debe estar activa en el padrón para pedir un asiento.");
      else setError(message);
    } finally {
      setRequestingId(null);
    }
  }

  async function cancelSeat(rideId: number) {
    setError(null);
    setRequestingId(rideId);
    try {
      await cancelRideSeat({ data: { rideId } });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cancelar el asiento.");
    } finally {
      setRequestingId(null);
    }
  }

  return (
    <Shell
      eyebrow="Ruta 9114"
      title="Llegar a D-106 antes de las 07:00."
      lead="Comparte el vehículo, publica lugares disponibles y permite que los compañeros reserven su asiento desde el portal."
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          {rides.map((ride) => {
            const editable = canEditPublication(directory, user?.id, ride.createdBy);
            const reservations = ride.reservations ?? [];
            const reserved = reservations.length;
            const remaining = Math.max(0, ride.seats - reserved);
            const full = remaining === 0;
            const myReservation = Boolean(user?.id && reservations.some((item) => item.userId === user.id));
            const isOwner = Boolean(user?.id && ride.createdBy === user.id);
            const activeMember = directory?.me?.status === "activo";
            const busy = requestingId === ride.id;

            return (
              <Card key={ride.id} className={cn("overflow-hidden", full && "border-danger/25")}>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill>{ride.direction}</Pill>
                      <Pill>{ride.weekday}</Pill>
                      {full ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-danger/25 bg-danger/10 px-3 py-1 text-xs font-extrabold tracking-[0.08em] text-danger">
                          <XCircle className="size-3.5" /> LLENO
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-forest/15 bg-forest-soft px-3 py-1 text-xs font-semibold text-forest-deep">
                          {remaining} {remaining === 1 ? "lugar disponible" : "lugares disponibles"}
                        </span>
                      )}
                      {editable ? (
                        <button
                          type="button"
                          onClick={() => setEditing(ride)}
                          className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1 text-xs font-semibold text-forest transition-all hover:-translate-y-0.5 hover:shadow-sm"
                        >
                          <Pencil className="size-3.5" /> Editar
                        </button>
                      ) : null}
                    </div>

                    <h2 className="mt-3 font-display text-2xl">
                      {ride.fromPlace}
                      <span className="mx-2 text-muted">→</span>
                      {ride.toPlace}
                    </h2>
                    <p className="mt-2 text-sm text-muted">{ride.notes}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-clay">{ride.ownerAlias}</p>

                    <div className="mt-5 rounded-xl border border-line bg-bg-warm/55 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                          <UsersRound className="size-4 text-forest" /> Pasajeros confirmados
                        </p>
                        <span className="text-xs font-semibold text-muted">{reserved} / {ride.seats}</span>
                      </div>

                      {reservations.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {reservations.map((reservation, index) => (
                            <span
                              key={`${ride.id}-${reservation.userId}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-soft shadow-sm"
                            >
                              <CheckCircle2 className="size-3.5 text-forest" />
                              {index + 1}. {reservation.requesterAlias}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted">Todavía nadie ha pedido asiento.</p>
                      )}

                      <div className="mt-4">
                        {isOwner ? (
                          <p className="text-xs font-medium text-muted">Esta ruta la publicaste tú. Los compañeros pueden reservar los lugares disponibles.</p>
                        ) : myReservation ? (
                          <Button type="button" variant="line" disabled={busy} onClick={() => void cancelSeat(ride.id)} className="gap-2">
                            <X className="size-4" /> {busy ? "Cancelando…" : "Cancelar mi asiento"}
                          </Button>
                        ) : full ? (
                          <button type="button" disabled className="inline-flex min-h-11 items-center rounded-md bg-danger px-5 text-sm font-extrabold tracking-[0.08em] text-white opacity-90">
                            LLENO
                          </button>
                        ) : !user ? (
                          <Link to="/login" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-forest px-4 text-sm font-semibold text-bg shadow-sm">
                            <UserPlus className="size-4" /> Entrar para pedir asiento
                          </Link>
                        ) : !activeMember ? (
                          <Link to="/registro" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line-strong bg-white px-4 text-sm font-semibold text-forest">
                            <UserPlus className="size-4" /> Activa tu registro para pedir asiento
                          </Link>
                        ) : (
                          <Button type="button" disabled={busy} onClick={() => void requestSeat(ride.id)} className="gap-2">
                            <UserPlus className="size-4" /> {busy ? "Reservando…" : "Pedir un asiento"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className={cn("font-display text-3xl tabular-nums leading-none", full && "text-danger")}>{remaining}</p>
                    <p className={cn("mt-1 text-xs uppercase tracking-[0.12em]", full ? "font-bold text-danger" : "text-muted")}>{full ? "LLENO" : "disponibles"}</p>
                    <p className="mt-2 text-sm tabular-nums">{ride.timeSlot}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div>
          {editing ? (
            <FormBox title="Editar ruta" onSubmit={onEdit}>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="inline-flex items-center gap-1 justify-self-end text-xs font-semibold text-forest"
              >
                <X className="size-3.5" /> Cancelar
              </button>
              <RideFields ride={editing} />
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <Button type="submit">
                <Pencil className="mr-2 size-4" /> Guardar cambios
              </Button>
            </FormBox>
          ) : (
            <PublishGate area="rutas">
              <FormBox title="Ofrecer asiento" onSubmit={onSubmit}>
                <RideFields />
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                <Button type="submit">Publicar ruta</Button>
              </FormBox>
            </PublishGate>
          )}
        </div>
      </div>
    </Shell>
  );
}

function RideFields({ ride }: { ride?: RideItem }) {
  return (
    <>
      <Field label="Sentido">
        <Select name="direction" defaultValue={ride?.direction ?? "Ida"}>
          <option>Ida</option>
          <option>Vuelta</option>
        </Select>
      </Field>
      <Field label="Sale de">
        <Input name="fromPlace" required defaultValue={ride?.fromPlace ?? ""} placeholder="Metro Copilco" />
      </Field>
      <Field label="Llega a">
        <Input name="toPlace" required defaultValue={ride?.toPlace ?? ""} placeholder="Puerta sur" />
      </Field>
      <Field label="Día">
        <Select name="weekday" defaultValue={ride?.weekday ?? "Lunes"}>
          <option>Lunes</option>
          <option>Martes</option>
          <option>Miércoles</option>
          <option>Jueves</option>
          <option>Viernes</option>
          <option>Sábado</option>
        </Select>
      </Field>
      <Field label="Hora">
        <Input name="timeSlot" required defaultValue={ride?.timeSlot ?? ""} placeholder="07:20" />
      </Field>
      <Field label="Asientos disponibles en el auto" hint="No incluye al conductor">
        <Input name="seats" type="number" min={1} max={6} defaultValue={ride?.seats ?? 2} />
      </Field>
      <Field label="Punto de encuentro">
        <Textarea name="notes" required defaultValue={ride?.notes ?? ""} placeholder="Salida oriente del metro" />
      </Field>
      <Field label="Alias de ruta">
        <Input name="ownerAlias" required defaultValue={ride?.ownerAlias ?? ""} placeholder="Ruta sur" />
      </Field>
    </>
  );
}
