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
  createdBy?: string;
};

export type BookItem = {
  id: number;
  title: string;
  author: string;
  kind: string;
  course: string | null;
  notes: string;
  ownerAlias: string;
  publisher?: string | null;
  publicationYear?: string | null;
  edition?: string | null;
  isbn?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  externalUrl?: string | null;
  commerceUrl?: string | null;
  priceText?: string | null;
  createdBy?: string;
};

export type RideReservation = {
  userId: string;
  requesterAlias: string;
  createdAt: string;
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
  createdBy?: string;
  reservations: RideReservation[];
};

export type StudyGroup = {
  id: number;
  name: string;
  course: string;
  whenText: string;
  place: string;
  notes: string;
  createdBy?: string;
};

export type Notice = {
  id: number;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  createdBy?: string;
};

export type BitacoraPost = {
  id: number;
  title: string;
  body: string;
  imageUrl: string | null;
  imageName: string | null;
  shotDate: string | null;
  place: string | null;
  authorAlias: string;
  createdAt: string;
  createdBy?: string;
};


export type ClassMaterial = {
  id: number;
  courseCode: string;
  courseName: string;
  professorName: string;
  classDate: string;
  kind: "Apuntes" | "Tarea" | "Foto" | "Material" | "Aviso" | "Referencia" | "Bibliografía";
  title: string;
  body: string;
  referencesText: string | null;
  bibliographyText: string | null;
  fileUrl: string | null;
  fileName: string | null;
  externalUrl: string | null;
  authorAlias: string;
  createdAt: string;
  createdBy?: string;
};

export type ServiceOffer = {
  id: number;
  title: string;
  category: "Desayuno" | "Comida" | "Sándwiches" | "Postres" | "Bebidas" | "Otro";
  description: string;
  priceText: string;
  availabilityDays: string;
  deliveryPlace: string;
  orderCutoff: string | null;
  howToOrder: string;
  imageUrl: string | null;
  imageName: string | null;
  sellerAlias: string;
  createdAt: string;
  createdBy?: string;
};

export type Board = {
  professors: Professor[];
  courses: Course[];
  events: EventItem[];
  books: BookItem[];
  rides: RideItem[];
  groups: StudyGroup[];
  notices: Notice[];
  posts: BitacoraPost[];
  materials: ClassMaterial[];
  services: ServiceOffer[];
};
