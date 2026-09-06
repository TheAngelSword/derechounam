import { Link } from "@tanstack/react-router";
import { areaModerators, canPublish, useDirectory } from "@/components/directory";
import type { AreaId } from "@/lib/members";

export function PublishGate({
  area,
  children,
}: {
  area: AreaId;
  children: React.ReactNode;
}) {
  const { user, isSessionPending, directory, isLoading } = useDirectory();
  const mods = areaModerators(directory, area);

  return (
    <div className="grid gap-3">
      {mods.length ? (
        <p className="text-xs text-muted">
          Modera {mods.map((item) => item.alias).join(", ")}
        </p>
      ) : (
        <p className="text-xs text-muted">Esta área aún no tiene moderador asignado.</p>
      )}
      {isSessionPending || isLoading ? (
        <div className="h-24 animate-pulse rounded-lg bg-bg-warm" />
      ) : !user ? (
        <p className="rounded-lg border border-line bg-bg-warm p-4 text-sm">
          Para publicar hay que <Link to="/login" className="font-medium text-forest">entrar</Link> y
          quedar en el padrón.
        </p>
      ) : !directory?.me ? (
        <p className="rounded-lg border border-line bg-bg-warm p-4 text-sm">
          Tu cuenta no está en el registro.{" "}
          <Link to="/registro" className="font-medium text-forest">
            Completa el alta
          </Link>
          .
        </p>
      ) : directory.me.status !== "activo" ? (
        <p className="rounded-lg border border-line bg-bg-warm p-4 text-sm">
          Tu acceso está {directory.me.status}. Un moderador puede reactivarlo.
        </p>
      ) : canPublish(directory) ? (
        children
      ) : null}
    </div>
  );
}
