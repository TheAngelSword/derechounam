import { useQuery, useQueryClient } from "@tanstack/react-query";
import { loadBoard } from "@/lib/content";
import { seedBoard } from "@/lib/seed";
import type { Board } from "@/lib/types";

export function useBoard(): Board {
  const query = useQuery({
    queryKey: ["board"],
    queryFn: () => loadBoard(),
    staleTime: 10_000,
  });
  return query.data ?? seedBoard;
}

export function useRefreshBoard() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["board"] });
}
