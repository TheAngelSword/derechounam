import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useRefreshBoard } from "@/components/board-context";
import { Button, Card, Field, FormBox, Input, Textarea } from "@/components/ui";
import { PublishGate } from "@/components/publish-gate";
import { useAreaVisit } from "@/components/directory";
import { addGroup } from "@/lib/content";

export const Route = createFileRoute("/mesas")({ component: MesasPage });

function MesasPage() {
  const { groups } = useBoard();
  const refresh = useRefreshBoard();
  useAreaVisit("mesas");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const course = String(data.get("course") ?? "").trim();
    const whenText = String(data.get("whenText") ?? "").trim();
    const place = String(data.get("place") ?? "").trim();
    const notes = String(data.get("notes") ?? "").trim();
    if (name.length < 3 || course.length < 3 || whenText.length < 3 || place.length < 3 || notes.length < 3) {
      setError("Falta el nombre de la mesa o el horario.");
      return;
    }
    try {
      await addGroup({ data: { name, course, whenText, place, notes } });
      form.reset();
      await refresh();
    } catch {
      setError("Entra al padrón para publicar.");
    }
  }

  return (
    <Shell
      eyebrow="Después de la jornada"
      title="Una mesa por materia del bloque."
      lead="Romano, personas, historia, teoría y sociología. El cupo se cierra en la propia mesa."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4 md:grid-cols-2 lg:col-span-2">
          {groups.map((group) => (
            <Card key={group.id}>
              <p className="text-xs uppercase tracking-[0.14em] text-clay">{group.course}</p>
              <h2 className="mt-2 font-display text-2xl">{group.name}</h2>
              <p className="mt-3 text-sm">
                {group.whenText} · {group.place}
              </p>
              <p className="mt-2 text-sm text-muted">{group.notes}</p>
            </Card>
          ))}
        </div>
        <PublishGate area="mesas">
        <FormBox title="Abrir una mesa" onSubmit={onSubmit}>
          <Field label="Nombre">
            <Input name="name" required placeholder="Mesa de precedentes" />
          </Field>
          <Field label="Materia">
            <Input name="course" required placeholder="Constitucional II" />
          </Field>
          <Field label="Cuándo">
            <Input name="whenText" required placeholder="Domingo 11:00" />
          </Field>
          <Field label="Dónde">
            <Input name="place" required placeholder="Biblioteca · sala 4" />
          </Field>
          <Field label="Acuerdo">
            <Textarea name="notes" required placeholder="Una ficha por semana" />
          </Field>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit">Publicar mesa</Button>
        </FormBox>
        </PublishGate>
      </div>
    </Shell>
  );
}
