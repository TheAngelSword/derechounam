import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useRefreshBoard } from "@/components/board-context";
import { Button, Card, Field, FormBox, Input, Pill, Select, Textarea } from "@/components/ui";
import { PublishGate } from "@/components/publish-gate";
import { useAreaVisit } from "@/components/directory";
import { addEvent } from "@/lib/content";
import { formatLongDate, getTodayIso } from "@/lib/format";

export const Route = createFileRoute("/agenda")({ component: AgendaPage });

const KINDS = ["Todas", "Taller", "Conferencia", "Actividad", "Clínica", "Social"] as const;

function AgendaPage() {
  const { events } = useBoard();
  const refresh = useRefreshBoard();
  useAreaVisit("agenda");
  const [filter, setFilter] = useState<(typeof KINDS)[number]>("Todas");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const visible = useMemo(
    () => events.filter((event) => filter === "Todas" || event.kind === filter),
    [events, filter],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const timeSlot = String(data.get("timeSlot") ?? "").trim();
    const place = String(data.get("place") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const hostAlias = String(data.get("hostAlias") ?? "").trim();
    const eventDate = String(data.get("eventDate") ?? "");
    if (title.length < 3 || !eventDate || timeSlot.length < 4 || place.length < 3 || description.length < 3 || hostAlias.length < 2) {
      setError("Revisa los campos. Usa un alias de mesa, no datos personales.");
      return;
    }
    try {
      await addEvent({
        data: {
          title,
          kind: String(data.get("kind") ?? "Taller") as "Taller",
          eventDate,
          timeSlot,
          place,
          modality: String(data.get("modality") ?? "Presencial") as "Presencial",
          description,
          hostAlias,
        },
      });
      form.reset();
      setSuccess("Actividad publicada en la agenda.");
      await refresh();
    } catch {
      setError("Entra al padrón para publicar. Revisa los campos.");
    }
  }

  return (
    <Shell
      eyebrow="Después de las 14:00"
      title="Talleres del grupo, cuando suelta E-003."
      lead="Lecturas de romano, mapas del acto jurídico y cineforo de legalidad. Publica con el alias de tu mesa."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {KINDS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            aria-pressed={filter === item}
            className={
              filter === item
                ? "min-h-11 rounded-full bg-forest px-4 text-sm text-bg"
                : "min-h-11 rounded-full border border-line bg-surface px-4 text-sm text-ink-soft"
            }
          >
            {item}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          {visible.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap items-center gap-2">
                <Pill>{item.kind}</Pill>
                <Pill>{item.modality}</Pill>
                <span className="text-xs tabular-nums text-muted">{formatLongDate(item.eventDate)}</span>
              </div>
              <h2 className="mt-3 font-display text-2xl">{item.title}</h2>
              <p className="mt-2 text-sm text-muted">{item.description}</p>
              <p className="mt-3 text-sm">
                {item.timeSlot} · {item.place} · {item.hostAlias}
              </p>
            </Card>
          ))}
        </div>
        <PublishGate area="agenda">
        <FormBox title="Publicar en la agenda" onSubmit={onSubmit}>
          <Field label="Título">
            <Input name="title" required maxLength={80} placeholder="Taller de alegatos" />
          </Field>
          <Field label="Tipo">
            <Select name="kind" defaultValue="Taller">
              <option>Taller</option>
              <option>Conferencia</option>
              <option>Actividad</option>
              <option>Clínica</option>
              <option>Social</option>
            </Select>
          </Field>
          <Field label="Fecha">
            <Input name="eventDate" type="date" required defaultValue={getTodayIso()} />
          </Field>
          <Field label="Horario">
            <Input name="timeSlot" required placeholder="17:00–19:00" />
          </Field>
          <Field label="Lugar">
            <Input name="place" required placeholder="Sala 2 o aula virtual" />
          </Field>
          <Field label="Modalidad">
            <Select name="modality" defaultValue="Presencial">
              <option>Presencial</option>
              <option>En línea</option>
              <option>Híbrido</option>
            </Select>
          </Field>
          <Field label="Nota">
            <Textarea name="description" required maxLength={240} placeholder="Qué llevar y cupo" />
          </Field>
          <Field label="Alias de mesa">
            <Input name="hostAlias" required maxLength={40} placeholder="Moot court" />
          </Field>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {success ? <p className="rounded-md bg-forest-soft px-3 py-2 text-sm font-medium text-forest-deep">{success}</p> : null}
          <Button type="submit">Publicar</Button>
        </FormBox>
        </PublishGate>
      </div>
    </Shell>
  );
}
