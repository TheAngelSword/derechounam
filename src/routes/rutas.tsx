import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useRefreshBoard } from "@/components/board-context";
import { Button, Card, Field, FormBox, Input, Pill, Select, Textarea } from "@/components/ui";
import { PublishGate } from "@/components/publish-gate";
import { useAreaVisit } from "@/components/directory";
import { addRide } from "@/lib/content";

export const Route = createFileRoute("/rutas")({ component: RutasPage });

function RutasPage() {
  const { rides } = useBoard();
  const refresh = useRefreshBoard();
  useAreaVisit("rutas");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const fromPlace = String(data.get("fromPlace") ?? "").trim();
    const toPlace = String(data.get("toPlace") ?? "").trim();
    const timeSlot = String(data.get("timeSlot") ?? "").trim();
    const notes = String(data.get("notes") ?? "").trim();
    const ownerAlias = String(data.get("ownerAlias") ?? "").trim();
    const seats = Number(data.get("seats") ?? 2);
    if (fromPlace.length < 3 || toPlace.length < 3 || timeSlot.length < 4 || notes.length < 3 || ownerAlias.length < 2) {
      setError("Usa puntos de encuentro del campus o el metro. Sin teléfonos.");
      return;
    }
    try {
      await addRide({
        data: {
          direction: String(data.get("direction") ?? "Ida") as "Ida",
          fromPlace,
          toPlace,
          weekday: String(data.get("weekday") ?? "Lunes") as "Lunes",
          timeSlot,
          seats: Number.isFinite(seats) ? Math.min(6, Math.max(1, seats)) : 2,
          notes,
          ownerAlias,
        },
      });
      form.reset();
      await refresh();
    } catch {
      setError("Entra al padrón para publicar.");
    }
  }

  return (
    <Shell
      eyebrow="Ruta 9114"
      title="Llegar a D-106 antes de las 07:00."
      lead="Salida a las 06:35. Vuelta a las 14:10 desde E-003, cuando termina Ser universitario."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          {rides.map((ride) => (
            <Card key={ride.id} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Pill>{ride.direction}</Pill>
                  <Pill>{ride.weekday}</Pill>
                </div>
                <h2 className="mt-3 font-display text-2xl">
                  {ride.fromPlace}
                  <span className="mx-2 text-muted">→</span>
                  {ride.toPlace}
                </h2>
                <p className="mt-2 text-sm text-muted">{ride.notes}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.12em] text-clay">{ride.ownerAlias}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-3xl tabular-nums leading-none">{ride.seats}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted">asientos</p>
                <p className="mt-2 text-sm tabular-nums">{ride.timeSlot}</p>
              </div>
            </Card>
          ))}
        </div>
        <PublishGate area="rutas">
        <FormBox title="Ofrecer asiento" onSubmit={onSubmit}>
          <Field label="Sentido">
            <Select name="direction" defaultValue="Ida">
              <option>Ida</option>
              <option>Vuelta</option>
            </Select>
          </Field>
          <Field label="Sale de">
            <Input name="fromPlace" required placeholder="Metro Copilco" />
          </Field>
          <Field label="Llega a">
            <Input name="toPlace" required placeholder="Puerta sur" />
          </Field>
          <Field label="Día">
            <Select name="weekday" defaultValue="Lunes">
              <option>Lunes</option>
              <option>Martes</option>
              <option>Miércoles</option>
              <option>Jueves</option>
              <option>Viernes</option>
              <option>Sábado</option>
            </Select>
          </Field>
          <Field label="Hora">
            <Input name="timeSlot" required placeholder="07:20" />
          </Field>
          <Field label="Asientos">
            <Input name="seats" type="number" min={1} max={6} defaultValue={2} />
          </Field>
          <Field label="Punto de encuentro">
            <Textarea name="notes" required placeholder="Salida oriente del metro" />
          </Field>
          <Field label="Alias de ruta">
            <Input name="ownerAlias" required placeholder="Ruta sur" />
          </Field>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit">Publicar ruta</Button>
        </FormBox>
        </PublishGate>
      </div>
    </Shell>
  );
}
