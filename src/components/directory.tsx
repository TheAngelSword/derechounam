import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { loadDirectory, logAccess, type AreaId, type Directory } from "@/lib/members";

export function useDirectory() {
  const { user, isPending } = useCurrentUserState();
  const query = useQuery({
    queryKey: ["directory", user?.id ?? "out"],
    queryFn: () => loadDirectory(),
    enabled: !isPending && Boolean(user),
    retry: false,
  });
  return {
    isSessionPending: isPending,
    user,
    directory: query.data ?? null,
    isLoading: Boolean(user) && query.isPending,
    reload: query.refetch,
  };
}

export function canPublish(directory: Directory | null) {
  return Boolean(directory?.me && directory.me.status === "activo");
}


export function canEditPublication(
  directory: Directory | null,
  currentUserId: string | undefined,
  createdBy: string | undefined,
) {
  const me = directory?.me;
  if (!me || me.status !== "activo" || !currentUserId) return false;
  return me.role === "moderador" || Boolean(createdBy && createdBy === currentUserId);
}

export function isModerator(directory: Directory | null) {
  return directory?.me?.role === "moderador" && directory.me.status === "activo";
}

export function areaModerators(directory: Directory | null, area: AreaId) {
  return directory?.mods.filter((item) => item.area === area) ?? [];
}

export function useAreaVisit(area: AreaId) {
  const { user, isPending } = useCurrentUserState();
  useEffect(() => {
    if (isPending || !user) return;
    void logAccess({ data: { area, action: "entrada" } }).catch(() => undefined);
  }, [area, isPending, user]);
}

export function useInvalidateDirectory() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["directory"] });
}
