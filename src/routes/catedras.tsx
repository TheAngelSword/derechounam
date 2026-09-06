import { createFileRoute } from "@tanstack/react-router";
import { Clock3, GraduationCap, MapPin, UserRound } from "lucide-react";
import { Shell } from "@/components/shell";
import { useBoard } from "@/components/board-context";
import { useAreaVisit } from "@/components/directory";
import { Card, Pill } from "@/components/ui";

export const Route = createFileRoute("/catedras")({ component: CatedrasPage });

function CatedrasPage() {
  const { courses } = useBoard();
  useAreaVisit("catedras");
  const ordered = [...courses].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  return (
    <Shell
      eyebrow="Docentes · Grupo 9114"
      title="Las siete materias y sus docentes."
      lead="Directorio académico del primer semestre con clave, horario y salón del grupo 9114."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {ordered.map((course) => (
          <Card key={course.id} interactive>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Pill tone="forest">{course.code}</Pill>
              <span className="text-xs font-medium text-muted">{course.semester}</span>
            </div>
            <h2 className="mt-3 font-display text-2xl leading-tight">{course.name}</h2>
            <p className="mt-3 inline-flex items-start gap-2 text-sm font-semibold text-forest">
              <UserRound className="mt-0.5 size-4 shrink-0" />
              {course.chair}
            </p>
            <div className="mt-5 grid gap-2 border-t border-line pt-4 text-sm text-ink-soft sm:grid-cols-2">
              <span className="inline-flex items-center gap-2"><Clock3 className="size-4 text-muted" />{course.timeSlot}</span>
              <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-muted" />{course.place}</span>
              <span className="inline-flex items-center gap-2 sm:col-span-2"><GraduationCap className="size-4 text-muted" />{course.weekday} · Grupo {course.group}</span>
            </div>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
