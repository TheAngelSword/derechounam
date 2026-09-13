import { useQuery, useQueryClient } from "@tanstack/react-query";
import { loadBoard } from "@/lib/content";
import { seedBoard } from "@/lib/seed";
import type { Board } from "@/lib/types";

const boardQuery = {
  queryKey: ["board"] as const,
  queryFn: () => loadBoard(),
  staleTime: 10_000,
};

export function useBoard(): Board {
  const query = useQuery(boardQuery);
  return query.data ?? seedBoard;
}

export function useBoardStatus() {
  const query = useQuery(boardQuery);
  return {
    isError: query.isError,
    errorMessage: query.error instanceof Error ? query.error.message : query.isError ? "No se pudo cargar la base de datos." : null,
    isFetching: query.isFetching,
  };
}

export function useRefreshBoard() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["board"] });
}
