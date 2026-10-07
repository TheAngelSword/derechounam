/** Shared, dependency-free validation. Never trust a browser's MIME or file size. */
export const MEDIA_LIMITS = { biblioteca: 100, bitacora: 20, catedras: 512, servicios: 15, noticias: 256 } as const;
export type MediaCategory = keyof typeof MEDIA_LIMITS;
const MIME_BY_EXT: Record<string,string> = {
  pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  epub: "application/epub+zip", txt: "text/plain", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  mp3: "audio/mpeg", m4a: "audio/mp4", ogg: "audio/ogg", wav: "audio/wav", mp4: "video/mp4", webm: "video/webm",
};
const EXTENSIONS: Record<MediaCategory, string[]> = {
  biblioteca: ["pdf","doc","docx","epub"], bitacora: ["jpg","jpeg","png","webp"], servicios: ["jpg","jpeg","png","webp"],
  catedras: ["pdf","doc","docx","txt","jpg","jpeg","png","webp","mp3","m4a","ogg","wav","mp4","webm"],
  noticias: ["jpg","jpeg","png","webp","mp4","webm"],
};
export function parseFolderId(value: string): string {
  let id = value.trim();
  if (id.startsWith("https://")) {
    const url = new URL(id);
    if (url.hostname !== "drive.google.com" || url.username || url.password || url.port) throw new Error("Usa una carpeta de drive.google.com.");
    id = url.pathname.match(/\/folders\/([\w-]+)/)?.[1] || url.searchParams.get("id") || "";
  }
  if (!/^[a-zA-Z0-9_-]{10,200}$/.test(id)) throw new Error("El ID de la carpeta de Drive no es válido.");
  return id;
}
export function normalizeSubfolder(value: unknown): string[] {
  return String(value ?? "").replace(/\\/g,"/").split("/").filter(Boolean).slice(0,4)
    .map((s) => s.normalize("NFKC").replace(/[^a-zA-Z0-9_-]/g,"-").replace(/-+/g,"-").slice(0,50)).filter((s) => /[a-zA-Z0-9]/.test(s));
}
export type UploadInput = { category: MediaCategory; fileName: string; contentType: string; size: number; subfolder: string[] };
export function validateUpload(value: unknown): UploadInput {
  if (!value || typeof value !== "object") throw new Error("Solicitud de archivo no válida.");
  const v = value as Record<string,unknown>;
  const category = v.category as MediaCategory;
  if (!Object.hasOwn(MEDIA_LIMITS,category)) throw new Error("Sección de archivos no permitida.");
  const fileName = String(v.fileName ?? "").replace(/[\x00-\x1f\x7f/\\]/g,"_").trim().slice(0,180);
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!fileName || !EXTENSIONS[category].includes(ext)) throw new Error("El formato no está permitido en esta sección.");
  const size = Number(v.size);
  if (!Number.isSafeInteger(size) || size <= 0 || size > MEDIA_LIMITS[category]*1024*1024) throw new Error(`El límite para ${category} es ${MEDIA_LIMITS[category]} MB.`);
  return { category, fileName, contentType: MIME_BY_EXT[ext], size, subfolder: normalizeSubfolder(v.subfolder) };
}
export function validUploadSession(value: string): boolean {
  try { const u = new URL(value); return u.protocol === "https:" && ["www.googleapis.com","content.googleapis.com"].includes(u.hostname) && u.pathname === "/upload/drive/v3/files" && !u.username && !u.password && !u.port; } catch { return false; }
}
export function uploadedOffset(range: string | null): number {
  const match = /^bytes=0-(\d+)$/.exec(range ?? "");
  const offset=match ? Number(match[1])+1 : 0;
  return Number.isSafeInteger(offset) && offset >= 0 ? offset : 0;
}
export function driveResourceUrl(origin: string, id: string): string {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Identificador de recurso no válido.");
  return new URL(`/api/drive-file?id=${id}`,origin).href;
}
