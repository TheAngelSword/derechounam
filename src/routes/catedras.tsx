import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { useBoard } from "@/components/board-context";
import { useAreaVisit } from "@/components/directory";
import { Card, Pill } from "@/components/ui";

export const Route = createFileRoute("/catedras")({ component: CatedrasPage });

function CatedrasPage() {
  const { professors } = useBoard();
  useAreaVisit("catedras");

  return (
    <Shell
      eyebrow="Grupo 9114"
      title="Las siete cátedras del primer semestre."
      lead="Cubículos en D y E, después de las 14:00. Cada ficha es la materia, no un directorio personal."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {professors.map((item) => (
          <Card key={item.id}>
            <Pill>{item.area}</Pill>
            <h2 className="mt-3 font-display text-2xl">{item.fullTitle}</h2>
            <dl className="mt-4 grid gap-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Cubículo</dt>
                <dd>{item.office}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Atención</dt>
                <dd className="text-right">{item.hours}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Modalidad</dt>
                <dd>{item.modality}</dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
