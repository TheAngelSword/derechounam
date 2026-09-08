import { createFileRoute } from "@tanstack/react-router";
import {
  BookMarked,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Pencil,
  Search,
  ShoppingCart,
  UploadCloud,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useRefreshBoard } from "@/components/board-context";
import { Button, Card, Field, FormBox, Input, Pill, Select, Textarea, cn } from "@/components/ui";
import { PublishGate } from "@/components/publish-gate";
import { canEditPublication, useAreaVisit, useDirectory } from "@/components/directory";
import { addBook, updateBook } from "@/lib/content";
import { uploadToAtrioMedia } from "@/lib/media-upload";
import type { BookItem, Course } from "@/lib/types";

export const Route = createFileRoute("/biblioteca")({ component: BibliotecaPage });

const KINDS = ["Todas", "Bibliografía", "Descarga", "Préstamo", "Venta", "Recomendación"] as const;
type LibraryKind = Exclude<(typeof KINDS)[number], "Todas">;
type UploadFormat = "PDF" | "Word" | "EPUB";

type UploadedFile = { url: string; name: string } | null;

function citationFor(book: BookItem) {
  const year = book.publicationYear?.trim() || "s. f.";
  const edition = book.edition?.trim() ? ` ${book.edition.trim()}.` : "";
  const publisher = book.publisher?.trim() ? ` ${book.publisher.trim()}.` : "";
  const isbn = book.isbn?.trim() ? ` ISBN ${book.isbn.trim()}.` : "";
  return `${book.author.trim()} (${year}). ${book.title.trim()}.${edition}${publisher}${isbn}`.replace(/\s+/g, " ").trim();
}

function normalizeOptionalUrl(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function friendlyLibraryError(message: string) {
  if (/path[^\n]*author|"author"/i.test(message) && /too_big|maximum/i.test(message)) return "El campo Autor es demasiado largo.";
  if (/path[^\n]*title|"title"/i.test(message) && /too_big|maximum/i.test(message)) return "El título es demasiado largo.";
  if (/invalid.*url|invalid_format|url/i.test(message)) return "Revisa el enlace. Puedes pegarlo con o sin https://.";
  if (/autor de la publicación|administrador/i.test(message)) return "Sólo quien publicó este recurso o un administrador puede editarlo.";
  if (/too_big|maximum/i.test(message)) return "Uno de los campos supera el tamaño permitido.";
  return message;
}

function formatFilesCount(book: BookItem) {
  return Number(Boolean(book.pdfUrl)) + Number(Boolean(book.wordUrl)) + Number(Boolean(book.epubUrl));
}

function BibliotecaPage() {
  const { books, courses } = useBoard();
  const refresh = useRefreshBoard();
  const { user, directory } = useDirectory();
  useAreaVisit("biblioteca");
  const [filter, setFilter] = useState<(typeof KINDS)[number]>("Todas");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadLabel, setUploadLabel] = useState<string>("archivo");
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("es-MX");
    return books.filter((book) => {
      const matchesKind = filter === "Todas" || book.kind === filter;
      if (!matchesKind) return false;
      if (!needle) return true;
      return [book.title, book.author, book.course, book.publisher, book.isbn]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("es-MX").includes(needle));
    });
  }, [books, filter, query]);

  const totalFiles = useMemo(() => books.reduce((total, book) => total + formatFilesCount(book), 0), [books]);

  async function copyCitation(book: BookItem) {
    try {
      await navigator.clipboard.writeText(citationFor(book));
      setCopiedId(book.id);
      window.setTimeout(() => setCopiedId((id) => (id === book.id ? null : id)), 1800);
    } catch {
      setError("No se pudo copiar la referencia bibliográfica.");
    }
  }

  async function uploadBookFile(file: FormDataEntryValue | null, format: UploadFormat): Promise<UploadedFile> {
    if (!(file instanceof File) || file.size === 0) return null;
    const lower = file.name.toLocaleLowerCase();
    const valid = format === "PDF"
      ? lower.endsWith(".pdf")
      : format === "EPUB"
        ? lower.endsWith(".epub")
        : lower.endsWith(".doc") || lower.endsWith(".docx");
    if (!valid) {
      throw new Error(format === "Word" ? "El archivo de Word debe ser .DOC o .DOCX." : `El archivo debe ser ${format}.`);
    }
    if (file.size > 100 * 1024 * 1024) throw new Error(`${format}: el archivo supera el límite de 100 MB.`);
    const now = new Date();
    setUploadLabel(format === "Word" ? "Word editable" : format);
    setUploadProgress(0);
    const stored = await uploadToAtrioMedia({
      file,
      category: "biblioteca",
      subfolder: `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`,
      onProgress: setUploadProgress,
    });
    return { url: stored.url, name: file.name };
  }

  function readBookForm(data: FormData) {
    return {
      title: String(data.get("title") ?? "").trim(),
      author: String(data.get("author") ?? "").trim(),
      kind: String(data.get("kind") ?? "Bibliografía") as LibraryKind,
      course: String(data.get("course") ?? "").trim(),
      notes: String(data.get("notes") ?? "").trim(),
      ownerAlias: String(data.get("ownerAlias") ?? "").trim(),
      publisher: String(data.get("publisher") ?? "").trim(),
      publicationYear: String(data.get("publicationYear") ?? "").trim(),
      edition: String(data.get("edition") ?? "").trim(),
      isbn: String(data.get("isbn") ?? "").trim(),
      externalUrl: normalizeOptionalUrl(data.get("externalUrl")),
      commerceUrl: normalizeOptionalUrl(data.get("commerceUrl")),
      priceText: String(data.get("priceText") ?? "").trim(),
    };
  }

  async function uploadAllFormats(data: FormData) {
    const pdf = await uploadBookFile(data.get("pdfFile"), "PDF");
    const word = await uploadBookFile(data.get("wordFile"), "Word");
    const epub = await uploadBookFile(data.get("epubFile"), "EPUB");
    return { pdf, word, epub };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null); setSuccess(null); setUploadProgress(null); setBusy(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = readBookForm(data);
    if (values.title.length < 2 || values.author.length < 2) {
      setError("Completa por lo menos el título y el autor."); setBusy(false); return;
    }
    try {
      const { pdf, word, epub } = await uploadAllFormats(data);
      const legacy = pdf ?? word ?? epub;
      await addBook({
        data: {
          ...values,
          fileUrl: legacy?.url ?? "",
          fileName: legacy?.name ?? "",
          pdfUrl: pdf?.url ?? "",
          pdfName: pdf?.name ?? "",
          wordUrl: word?.url ?? "",
          wordName: word?.name ?? "",
          epubUrl: epub?.url ?? "",
          epubName: epub?.name ?? "",
        },
      });
      form.reset(); setUploadProgress(null);
      const count = [pdf, word, epub].filter(Boolean).length;
      setSuccess(count ? `Ficha publicada con ${count} archivo${count === 1 ? "" : "s"}.` : "Ficha bibliográfica publicada.");
      await refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo publicar.";
      setError(/ge01|servidor de archivos|autorizar|subida|media/i.test(message) ? `No se pudo subir el archivo a ge01.com. ${message}` : friendlyLibraryError(message));
    } finally { setBusy(false); }
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingBook) return;
    setError(null); setSuccess(null); setUploadProgress(null); setBusy(true);
    const data = new FormData(event.currentTarget);
    const values = readBookForm(data);
    try {
      const { pdf, word, epub } = await uploadAllFormats(data);
      const pdfUrl = pdf?.url ?? editingBook.pdfUrl ?? "";
      const pdfName = pdf?.name ?? editingBook.pdfName ?? "";
      const wordUrl = word?.url ?? editingBook.wordUrl ?? "";
      const wordName = word?.name ?? editingBook.wordName ?? "";
      const epubUrl = epub?.url ?? editingBook.epubUrl ?? "";
      const epubName = epub?.name ?? editingBook.epubName ?? "";
      const legacyUrl = pdfUrl || wordUrl || epubUrl || editingBook.fileUrl || "";
      const legacyName = pdfName || wordName || epubName || editingBook.fileName || "";
      await updateBook({
        data: {
          id: editingBook.id,
          ...values,
          fileUrl: legacyUrl,
          fileName: legacyName,
          pdfUrl,
          pdfName,
          wordUrl,
          wordName,
          epubUrl,
          epubName,
        },
      });
      setEditingBook(null); setUploadProgress(null); setSuccess("Recurso actualizado.");
      await refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo guardar.";
      setError(friendlyLibraryError(message));
    } finally { setBusy(false); }
  }

  return (
    <Shell eyebrow="Biblioteca · Grupo 9114" title="Bibliografía, libros y recursos en un solo lugar." lead="Crea fichas bibliográficas por materia, comparte archivos autorizados en PDF, Word o EPUB y agrega enlaces de consulta o compra en línea.">
      <Card className="unam-hero-card hero-glow mb-6" interactive>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-bg/60"><BookMarked className="size-4" /> Biblioteca académica 9114</div>
            <h2 className="mt-2 font-display text-3xl">Una estantería útil para cada materia.</h2>
            <p className="mt-2 max-w-2xl text-sm text-bg/70">Cada ficha puede tener hasta tres versiones del mismo recurso: PDF, Word editable y EPUB, además de referencias y enlaces externos.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <LibraryStat value={books.length} label="recursos" />
            <LibraryStat value={totalFiles} label="archivos" />
            <LibraryStat value={books.filter((book) => Boolean(book.commerceUrl)).length} label="compras" />
          </div>
        </div>
      </Card>

      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-10" placeholder="Buscar por título, autor, materia, editorial o ISBN…" aria-label="Buscar en biblioteca" />
        </label>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={cn("min-h-11 rounded-full px-4 text-sm transition-colors", filter === item ? "bg-forest text-bg" : "border border-line bg-surface text-ink-soft hover:border-forest/30")}>{item}</button>)}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
        <div className="grid content-start gap-4 md:grid-cols-2">
          {visible.map((book) => {
            const editable = canEditPublication(directory, user?.id, book.createdBy);
            const hasAnyLink = Boolean(book.pdfUrl || book.wordUrl || book.epubUrl || book.externalUrl || book.commerceUrl);
            return (
              <Card key={book.id} interactive className="flex min-h-full flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Pill tone={book.kind === "Bibliografía" ? "forest" : book.kind === "Descarga" ? "clay" : "neutral"}>{book.kind}</Pill>
                  <div className="flex items-center gap-2">
                    {book.priceText ? <span className="text-sm font-semibold text-clay">{book.priceText}</span> : null}
                    {editable ? <button type="button" onClick={() => { setEditingBook(book); setError(null); setSuccess(null); }} className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-forest hover:border-forest/30"><Pencil className="size-3.5" />Editar</button> : null}
                  </div>
                </div>
                <h2 className="mt-3 font-display text-2xl leading-tight">{book.title}</h2>
                <p className="mt-1 text-sm text-muted">{book.author}</p>
                {book.course ? <p className="mt-2 text-sm font-medium text-forest">{book.course}</p> : null}
                {(book.publisher || book.publicationYear || book.edition || book.isbn) ? <div className="mt-4 rounded-lg border border-line bg-bg-warm/65 p-3"><div className="mb-2 flex items-center justify-between gap-2"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Ficha bibliográfica</p><button type="button" onClick={() => void copyCitation(book)} className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline">{copiedId === book.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copiedId === book.id ? "Copiada" : "Copiar"}</button></div><p className="text-sm leading-relaxed text-ink-soft">{citationFor(book)}</p></div> : null}
                {book.notes ? <p className="mt-3 text-sm leading-relaxed text-muted">{book.notes}</p> : null}
                <p className="mt-3 text-xs uppercase tracking-[0.12em] text-clay">{book.ownerAlias}</p>
                {hasAnyLink ? <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  {book.pdfUrl ? <ResourceButton href={book.pdfUrl} label="PDF" tone="primary" /> : null}
                  {book.wordUrl ? <ResourceButton href={book.wordUrl} label="Word editable" tone="secondary" /> : null}
                  {book.epubUrl ? <ResourceButton href={book.epubUrl} label="EPUB" tone="secondary" /> : null}
                  {book.externalUrl ? <a href={book.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-sm font-semibold text-ink-soft"><ExternalLink className="size-4" /> Consultar en línea</a> : null}
                  {book.commerceUrl ? <a href={book.commerceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-clay/25 bg-clay/10 px-3 text-sm font-semibold text-clay"><ShoppingCart className="size-4" /> Comprar en línea</a> : null}
                </div> : null}
              </Card>
            );
          })}
          {!visible.length ? <Card className="md:col-span-2"><p className="text-sm text-muted">No hay recursos que coincidan con esta búsqueda.</p></Card> : null}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          {editingBook ? (
            <FormBox title="Editar recurso" onSubmit={onEdit}>
              <div className="flex items-center justify-between rounded-lg bg-clay/10 p-3 text-xs text-ink-soft"><span>Editando una publicación existente.</span><button type="button" onClick={() => setEditingBook(null)} className="inline-flex items-center gap-1 font-semibold text-forest"><X className="size-3.5" />Cancelar</button></div>
              <BookFields courses={courses} book={editingBook} editMode />
              {uploadProgress !== null ? <UploadProgress value={uploadProgress} label={uploadLabel} /> : null}
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <Button type="submit" disabled={busy}><Pencil className="mr-2 size-4" />{busy ? "Guardando…" : "Guardar cambios"}</Button>
            </FormBox>
          ) : (
            <PublishGate area="biblioteca">
              <FormBox title="Crear ficha / subir libro" onSubmit={onSubmit}>
                <div className="rounded-lg border border-forest/10 bg-forest-soft p-3 text-xs leading-relaxed text-ink-soft"><span className="font-semibold text-forest">Bibliografía + formatos.</span> Puedes publicar sólo la referencia o adjuntar PDF, Word editable y/o EPUB en la misma ficha. Comparte únicamente material que tengas derecho a distribuir.</div>
                <BookFields courses={courses} />
                {uploadProgress !== null ? <UploadProgress value={uploadProgress} label={uploadLabel} /> : null}
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                {success ? <p className="text-sm font-medium text-forest">{success}</p> : null}
                <Button type="submit" disabled={busy}>{busy ? <><UploadCloud className="mr-2 size-4 animate-pulse" />Publicando…</> : <><FileText className="mr-2 size-4" />Publicar recurso</>}</Button>
              </FormBox>
            </PublishGate>
          )}
        </div>
      </div>
    </Shell>
  );
}

function BookFields({ courses, book, editMode = false }: { courses: Course[]; book?: BookItem; editMode?: boolean }) {
  return <>
    <Field label="Título"><Input name="title" required maxLength={300} defaultValue={book?.title ?? ""} placeholder="Introducción al estudio del derecho" /></Field>
    <Field label="Autor"><Input name="author" required maxLength={400} defaultValue={book?.author ?? ""} placeholder="Eduardo García Máynez o H. Congreso de la Unión" /></Field>
    <div className="grid grid-cols-2 gap-3">
      <Field label="Tipo"><Select name="kind" defaultValue={book?.kind ?? "Bibliografía"}><option>Bibliografía</option><option>Descarga</option><option>Préstamo</option><option>Venta</option><option>Recomendación</option></Select></Field>
      <Field label="Materia"><Select name="course" defaultValue={book?.course ?? ""}><option value="">General</option>{courses.map((course) => <option key={course.id}>{course.name}</option>)}</Select></Field>
    </div>
    <div className="border-t border-line pt-3"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Datos bibliográficos</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      <Field label="Editorial"><Input name="publisher" maxLength={240} defaultValue={book?.publisher ?? ""} placeholder="Porrúa" /></Field>
      <Field label="Año"><Input name="publicationYear" maxLength={40} defaultValue={book?.publicationYear ?? ""} placeholder="2026" /></Field>
      <Field label="Edición"><Input name="edition" maxLength={240} defaultValue={book?.edition ?? ""} placeholder="18.ª edición" /></Field>
      <Field label="ISBN"><Input name="isbn" maxLength={80} defaultValue={book?.isbn ?? ""} placeholder="978-…" /></Field>
    </div></div>

    <div className="border-t border-line pt-3">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Archivos del libro</p><p className="mt-1 text-xs text-muted">Puedes adjuntar uno, dos o los tres formatos.</p></div>
        <span className="text-xs text-muted">máx. 100 MB c/u</span>
      </div>
      <div className="grid gap-3">
        <Field label={editMode ? "Reemplazar PDF" : "PDF"} hint={editMode ? "opcional · vacío conserva el actual" : "documento de lectura"}><Input name="pdfFile" type="file" accept=".pdf,application/pdf" /></Field>
        {editMode && book?.pdfName ? <CurrentFile label="PDF actual" name={book.pdfName} /> : null}
        <Field label={editMode ? "Reemplazar Word editable" : "Word editable"} hint={editMode ? "opcional · .doc o .docx" : ".doc o .docx"}><Input name="wordFile" type="file" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" /></Field>
        {editMode && book?.wordName ? <CurrentFile label="Word actual" name={book.wordName} /> : null}
        <Field label={editMode ? "Reemplazar EPUB" : "EPUB"} hint={editMode ? "opcional · vacío conserva el actual" : "libro electrónico"}><Input name="epubFile" type="file" accept=".epub,application/epub+zip" /></Field>
        {editMode && book?.epubName ? <CurrentFile label="EPUB actual" name={book.epubName} /> : null}
      </div>
    </div>

    <Field label="Enlace de consulta externa" hint="opcional"><Input name="externalUrl" type="text" inputMode="url" maxLength={1500} defaultValue={book?.externalUrl ?? ""} placeholder="dof.gob.mx/... o https://…" /></Field>
    <Field label="Enlace para comprar en línea" hint="opcional"><Input name="commerceUrl" type="text" inputMode="url" maxLength={1500} defaultValue={book?.commerceUrl ?? ""} placeholder="https://editorial.com/libro" /></Field>
    <Field label="Precio" hint="opcional"><Input name="priceText" maxLength={120} defaultValue={book?.priceText ?? ""} placeholder="$350 MXN" /></Field>
    <Field label="Notas"><Textarea name="notes" maxLength={1800} defaultValue={book?.notes ?? ""} placeholder="Capítulos recomendados, vigencia, reformas, estado físico…" /></Field>
    <Field label="Alias / responsable"><Input name="ownerAlias" maxLength={160} defaultValue={book?.ownerAlias ?? ""} placeholder="Biblioteca 9114" /></Field>
  </>;
}

function ResourceButton({ href, label, tone }: { href: string; label: string; tone: "primary" | "secondary" }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={cn("inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-transform hover:-translate-y-0.5", tone === "primary" ? "bg-forest text-bg" : "border border-line-strong bg-surface text-forest")}><Download className="size-4" />{label}</a>;
}

function CurrentFile({ label, name }: { label: string; name: string }) {
  return <p className="-mt-2 text-xs text-muted"><span className="font-semibold text-ink-soft">{label}:</span> {name}</p>;
}

function UploadProgress({ value, label }: { value: number; label: string }) {
  return <div><div className="mb-1 flex justify-between text-xs text-muted"><span>Subiendo {label}</span><span>{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-clay transition-[width]" style={{ width: `${value}%` }} /></div></div>;
}

function LibraryStat({ value, label }: { value: number; label: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2"><p className="font-display text-2xl leading-none">{value}</p><p className="mt-1 text-[10px] text-bg/55">{label}</p></div>;
}
