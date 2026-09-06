import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useRefreshBoard } from "@/components/board-context";
import { Button, Card, Field, FormBox, Input, Pill, Textarea } from "@/components/ui";
import { PublishGate } from "@/components/publish-gate";
import { useAreaVisit } from "@/components/directory";
import { addNotice } from "@/lib/content";

export const Route = createFileRoute("/mural")({ component: MuralPage });

function MuralPage() {
  const { notices } = useBoard();
  const refresh = useRefreshBoard();
  useAreaVisit("mural");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const body = String(data.get("body") ?? "").trim();
    if (title.length < 3 || body.length < 3) {
      setError("El aviso necesita título y un texto breve.");
      return;
    }
    try {
      await addNotice({ data: { title, body } });
      form.reset();
      await refresh();
    } catch {
      setError("Entra al padrón para publicar.");
    }
  }

  return (
    <Shell
      eyebrow="Grupo 9114"
      title="Salón D-106, cruce a E-003, recados del día."
      lead="Lo urgente se clava arriba: jornada, cambio de edificio y listas."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          {notices.map((notice) => (
            <Card key={notice.id}>
              {notice.pinned ? <Pill>Fijo</Pill> : <Pill>Recado</Pill>}
              <h2 className="mt-3 font-display text-2xl">{notice.title}</h2>
              <p className="mt-2 text-sm text-muted">{notice.body}</p>
            </Card>
          ))}
        </div>
        <PublishGate area="mural">
        <FormBox title="Dejar un recado" onSubmit={onSubmit}>
          <Field label="Título">
            <Input name="title" required placeholder="Cambio de aula" />
          </Field>
          <Field label="Texto">
            <Textarea name="body" required placeholder="B-221 el martes por mantenimiento" />
          </Field>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit">Colgar aviso</Button>
        </FormBox>
        </PublishGate>
      </div>
    </Shell>
  );
}
