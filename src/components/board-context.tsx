import { useQuery, useQueryClient } from "@tanstack/react-query";
import { loadBoard } from "@/lib/content";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
const emptyBoard: Board = { professors:[],courses:[],events:[],books:[],rides:[],groups:[],notices:[],posts:[],materials:[],services:[],tasks:[] };
import type { Board } from "@/lib/types";

const boardQuery = {
  queryKey: ["board"] as const,
  queryFn: () => loadBoard(),
  staleTime: 10_000,
};

export function useBoard(): Board {
  const { user } = useCurrentUserState();
  const query = useQuery({...boardQuery,queryKey:["board",user?.id],enabled:!!user,retry:1});
  return query.data ?? emptyBoard;
}

export function useBoardStatus() {
  const { user } = useCurrentUserState();
  const query = useQuery({...boardQuery,queryKey:["board",user?.id],enabled:!!user,retry:1});
  return {
    isError: query.isError,
    errorMessage: query.error instanceof Error ? query.error.message : query.isError ? "No se pudo cargar la base de datos." : null,
    isFetching: query.isFetching,
  };
}

export function useRefreshBoard() {
  const client = useQueryClient();
  return async () => {
    await client.invalidateQueries({ queryKey: ["board"] });
    await client.refetchQueries({ queryKey: ["board"], type: "active" });
  };
}
