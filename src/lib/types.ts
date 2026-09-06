export type Professor = {
  id: number;
  fullTitle: string;
  area: string;
  office: string;
  hours: string;
  modality: string;
};

export type Course = {
  id: number;
  code: string;
  name: string;
  chair: string;
  modality: string;
  weekday: string;
  timeSlot: string;
  place: string;
  semester: string;
  group: string;
};

export type EventItem = {
  id: number;
  title: string;
  kind: string;
  eventDate: string;
  timeSlot: string;
  place: string;
  modality: string;
  description: string;
  hostAlias: string;
};

export type BookItem = {
  id: number;
  title: string;
  author: string;
  kind: string;
  course: string | null;
  notes: string;
  ownerAlias: string;
};

export type RideItem = {
  id: number;
  direction: string;
  fromPlace: string;
  toPlace: string;
  weekday: string;
  timeSlot: string;
  seats: number;
  notes: string;
  ownerAlias: string;
};

export type StudyGroup = {
  id: number;
  name: string;
  course: string;
  whenText: string;
  place: string;
  notes: string;
};

export type Notice = {
  id: number;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
};

export type Board = {
  professors: Professor[];
  courses: Course[];
  events: EventItem[];
  books: BookItem[];
  rides: RideItem[];
  groups: StudyGroup[];
  notices: Notice[];
};
