import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useRefreshBoard } from "@/components/board-context";
import { Button, Card, Field, FormBox, Input, Pill, Select, Textarea } from "@/components/ui";
import { PublishGate } from "@/components/publish-gate";
import { useAreaVisit } from "@/components/directory";
import { addBook } from "@/lib/content";

export const Route = createFileRoute("/biblioteca")({ component: BibliotecaPage });

const KINDS = ["Todas", "Préstamo", "Venta", "Recomendación"] as const;

function BibliotecaPage() {
  const { books } = useBoard();
  const refresh = useRefreshBoard();
  useAreaVisit("biblioteca");
  const [filter, setFilter] = useState<(typeof KINDS)[number]>("Todas");
  const [error, setError] = useState<string | null>(null);
  const visible = useMemo(
    () => books.filter((book) => filter === "Todas" || book.kind === filter),
    [books, filter],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const author = String(data.get("author") ?? "").trim();
    const notes = String(data.get("notes") ?? "").trim();
    const ownerAlias = String(data.get("ownerAlias") ?? "").trim();
    const course = String(data.get("course") ?? "").trim();
    if (title.length < 3 || author.length < 3 || notes.length < 3 || ownerAlias.length < 2) {
      setError("Completa título, autor y un alias de casillero o mesa.");
      return;
    }
    try {
      await addBook({
        data: {
          title,
          author,
          kind: String(data.get("kind") ?? "Préstamo") as "Préstamo",
          course,
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
      eyebrow="Estantería 9114"
      title="De Justiniano a García Máynez."
      lead="Un título por materia del primer semestre. Circulan en D-106, E-003 y el casillero del grupo."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {KINDS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
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
        <div className="grid gap-4 md:grid-cols-2 lg:col-span-2">
          {visible.map((book) => (
            <Card key={book.id}>
              <Pill>{book.kind}</Pill>
              <h2 className="mt-3 font-display text-2xl">{book.title}</h2>
              <p className="mt-1 text-sm text-muted">{book.author}</p>
              {book.course ? <p className="mt-2 text-sm">{book.course}</p> : null}
              <p className="mt-3 text-sm text-muted">{book.notes}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.12em] text-clay">{book.ownerAlias}</p>
            </Card>
          ))}
        </div>
        <PublishGate area="biblioteca">
        <FormBox title="Sumar un título" onSubmit={onSubmit}>
          <Field label="Título">
            <Input name="title" required placeholder="Manual de amparo" />
          </Field>
          <Field label="Autor">
            <Input name="author" required placeholder="Burgoa" />
          </Field>
          <Field label="Tipo">
            <Select name="kind" defaultValue="Préstamo">
              <option>Préstamo</option>
              <option>Venta</option>
              <option>Recomendación</option>
            </Select>
          </Field>
          <Field label="Materia">
            <Input name="course" placeholder="Amparo" />
          </Field>
          <Field label="Notas de entrega">
            <Textarea name="notes" required placeholder="Casillero B-12, dos semanas" />
          </Field>
          <Field label="Alias">
            <Input name="ownerAlias" required placeholder="Estantería 3er" />
          </Field>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit">Publicar</Button>
        </FormBox>
        </PublishGate>
      </div>
    </Shell>
  );
}
