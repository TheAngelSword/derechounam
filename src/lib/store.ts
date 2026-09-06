import { create } from "zustand";
import { seedBoard } from "@/lib/seed";
import type { Board, BookItem, EventItem, Notice, RideItem, StudyGroup } from "@/lib/types";

type Actions = {
  addEvent: (item: Omit<EventItem, "id">) => void;
  addBook: (item: Omit<BookItem, "id">) => void;
  addRide: (item: Omit<RideItem, "id">) => void;
  addGroup: (item: Omit<StudyGroup, "id">) => void;
  addNotice: (item: Omit<Notice, "id" | "pinned" | "createdAt">) => void;
};

function nextId(rows: Array<{ id: number }>) {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

export const useBoardStore = create<Board & Actions>()((set) => ({
  ...seedBoard,
  addEvent: (item) =>
    set((state) => ({ events: [...state.events, { ...item, id: nextId(state.events) }] })),
  addBook: (item) =>
    set((state) => ({ books: [...state.books, { ...item, id: nextId(state.books) }] })),
  addRide: (item) =>
    set((state) => ({ rides: [...state.rides, { ...item, id: nextId(state.rides) }] })),
  addGroup: (item) =>
    set((state) => ({ groups: [...state.groups, { ...item, id: nextId(state.groups) }] })),
  addNotice: (item) =>
    set((state) => ({
      notices: [
        {
          ...item,
          id: nextId(state.notices),
          pinned: false,
          createdAt: new Date().toISOString(),
        },
        ...state.notices,
      ],
    })),
}));
