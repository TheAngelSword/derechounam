export const NEWS_CATEGORIES = ["Facultad", "Universidad Abierta", "Legislación", "Justicia", "Comunidad"] as const;
export const LEGAL_STAGES = ["Información", "Aviso académico", "Evento", "Iniciativa", "Publicación DOF", "Jurisprudencia"] as const;
export type NewsItem = {
  id: string; title: string; summary: string; sourceId: string; sourceName: string; sourceUrl: string;
  category: string; legalStage: string; publishedAt: string | null; eventDate: string | null;
  imageUrl?: string | null; imageCredit?: string | null; videoUrl?: string | null; youtubeId?: string | null;
  pinned?: boolean; published?: boolean; snapshot?: boolean;
};
export type NewsSource = { id: string; name: string; url: string; homepage: string; hosts: string[]; category: string; kind: "rss" | "html"; enabled: boolean; note: string; keywords: string[] };
export type NewsSettings = { intervalMinutes: number; sources: NewsSource[] };
export type NewsSourceStatus = { id: string; name: string; enabled: boolean; checkedAt: string | null; fetchedAt: string | null; error: string | null; count: number; kind: string };
export type NewsFeed = { items: NewsItem[]; sources: NewsSourceStatus[]; error?: string; generatedAt: string };
