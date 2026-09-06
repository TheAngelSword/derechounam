import { createFileRoute } from "@tanstack/react-router";
import {
  BookMarked,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Search,
  ShoppingCart,
  UploadCloud,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useRefreshBoard } from "@/components/board-context";
import { Button, Card, Field, FormBox, Input, Pill, Select, Textarea, cn } from "@/components/ui";
import { PublishGate } from "@/components/publish-gate";
import { useAreaVisit } from "@/components/directory";
import { addBook } from "@/lib/content";
import { uploadToAtrioMedia } from "@/lib/media-upload";
import type { BookItem } from "@/lib/types";

export const Route = createFileRoute("/biblioteca")({ component: BibliotecaPage });

const KINDS = ["Todas", "Bibliografía", "Descarga", "Préstamo", "Venta", "Recomendación"] as const;
type LibraryKind = Exclude<(typeof KINDS)[number], "Todas">;

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
  if (/path[^\n]*author|\"author\"/i.test(message) && /too_big|maximum/i.test(message)) {
    return "El campo Autor es demasiado largo. Ya ampliamos el límite para nombres institucionales y referencias jurídicas extensas.";
  }
  if (/path[^\n]*title|\"title\"/i.test(message) && /too_big|maximum/i.test(message)) {
    return "El título es demasiado largo. Se amplió el límite para nombres completos de leyes, decretos y documentos jurídicos.";
  }
  if (/invalid.*url|invalid_format|url/i.test(message)) {
    return "Revisa la liga. Puedes pegarla con o sin https://; Atrio la completará automáticamente.";
  }
  if (/too_big|maximum/i.test(message)) {
    return "Uno de los campos supera el tamaño permitido. Reduce el texto o vuelve a intentarlo.";
  }
  return message;
}

function BibliotecaPage() {
  const { books, courses } = useBoard();
  const refresh = useRefreshBoard();
  useAreaVisit("biblioteca");
  const [filter, setFilter] = useState<(typeof KINDS)[number]>("Todas");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

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

  async function copyCitation(book: BookItem) {
    try {
      await navigator.clipboard.writeText(citationFor(book));
      setCopiedId(book.id);
      window.setTimeout(() => setCopiedId((id) => (id === book.id ? null : id)), 1800);
    } catch {
      setError("No se pudo copiar la referencia bibliográfica.");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setUploadProgress(null);
    setBusy(true);

    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const author = String(data.get("author") ?? "").trim();
    const kind = String(data.get("kind") ?? "Bibliografía") as LibraryKind;
    const file = data.get("bookFile");

    if (title.length < 2 || author.length < 2) {
      setError("Completa por lo menos el título y el autor.");
      setBusy(false);
      return;
    }

    let fileUrl = "";
    let fileName = "";

    try {
      if (file instanceof File && file.size > 0) {
        if (!file.name.toLocaleLowerCase().endsWith(".pdf") && !file.name.toLocaleLowerCase().endsWith(".epub")) {
          throw new Error("El archivo debe ser PDF o EPUB.");
        }
        if (file.size > 100 * 1024 * 1024) {
          throw new Error("El archivo supera el límite de 100 MB.");
        }

        const now = new Date();
        const stored = await uploadToAtrioMedia({
          file,
          category: "biblioteca",
          subfolder: `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`,
          onProgress: setUploadProgress,
        });
        fileUrl = stored.url;
        fileName = file.name;
      }

      await addBook({
        data: {
          title,
          author,
          kind,
          course: String(data.get("course") ?? "").trim(),
          notes: String(data.get("notes") ?? "").trim(),
          ownerAlias: String(data.get("ownerAlias") ?? "").trim(),
          publisher: String(data.get("publisher") ?? "").trim(),
          publicationYear: String(data.get("publicationYear") ?? "").trim(),
          edition: String(data.get("edition") ?? "").trim(),
          isbn: String(data.get("isbn") ?? "").trim(),
          fileUrl,
          fileName,
          externalUrl: normalizeOptionalUrl(data.get("externalUrl")),
          commerceUrl: normalizeOptionalUrl(data.get("commerceUrl")),
          priceText: String(data.get("priceText") ?? "").trim(),
        },
      });

      form.reset();
      setUploadProgress(null);
      setSuccess(fileUrl ? "Libro subido y ficha publicada." : "Ficha bibliográfica publicada.");
      await refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo publicar.";
      if (/ge01|servidor de archivos|autorizar|subida|media/i.test(message)) {
        setError(`No se pudo subir el archivo a ge01.com. ${message}`);
      } else if (/authorized|padrón|unauthorized/i.test(message)) {
        setError("Debes iniciar sesión y estar activo en el padrón para publicar.");
      } else {
        setError(friendlyLibraryError(message));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      eyebrow="Biblioteca · Grupo 9114"
      title="Bibliografía, libros y recursos en un solo lugar."
      lead="Crea fichas bibliográficas por materia, comparte descargas autorizadas y agrega enlaces para compra, venta o consulta externa."
    >
      <Card className="unam-hero-card hero-glow mb-6" interactive>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-bg/60">
              <BookMarked className="size-4" /> Biblioteca académica 9114
            </div>
            <h2 className="mt-2 font-display text-3xl">Una estantería útil para cada materia.</h2>
            <p className="mt-2 max-w-2xl text-sm text-bg/70">
              Las fichas pueden incluir editorial, año, edición, ISBN, archivo PDF/EPUB y ligas externas.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <LibraryStat value={books.length} label="recursos" />
            <LibraryStat value={books.filter((book) => Boolean(book.fileUrl)).length} label="archivos" />
            <LibraryStat value={books.filter((book) => Boolean(book.commerceUrl)).length} label="compras" />
          </div>
        </div>
      </Card>

      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-10"
            placeholder="Buscar por título, autor, materia, editorial o ISBN…"
            aria-label="Buscar en biblioteca"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                "min-h-11 rounded-full px-4 text-sm transition-colors",
                filter === item
                  ? "bg-forest text-bg"
                  : "border border-line bg-surface text-ink-soft hover:border-forest/30",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
        <div className="grid content-start gap-4 md:grid-cols-2">
          {visible.map((book) => (
            <Card key={book.id} interactive className="flex min-h-full flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Pill tone={book.kind === "Bibliografía" ? "forest" : book.kind === "Descarga" ? "clay" : "neutral"}>{book.kind}</Pill>
                {book.priceText ? <span className="text-sm font-semibold text-clay">{book.priceText}</span> : null}
              </div>

              <h2 className="mt-3 font-display text-2xl leading-tight">{book.title}</h2>
              <p className="mt-1 text-sm text-muted">{book.author}</p>
              {book.course ? <p className="mt-2 text-sm font-medium text-forest">{book.course}</p> : null}

              {(book.publisher || book.publicationYear || book.edition || book.isbn) ? (
                <div className="mt-4 rounded-lg border border-line bg-bg-warm/65 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Ficha bibliográfica</p>
                    <button
                      type="button"
                      onClick={() => void copyCitation(book)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
                    >
                      {copiedId === book.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copiedId === book.id ? "Copiada" : "Copiar"}
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-soft">{citationFor(book)}</p>
                </div>
              ) : null}

              {book.notes ? <p className="mt-3 text-sm leading-relaxed text-muted">{book.notes}</p> : null}
              <p className="mt-3 text-xs uppercase tracking-[0.12em] text-clay">{book.ownerAlias}</p>

              {(book.fileUrl || book.externalUrl || book.commerceUrl) ? (
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  {book.fileUrl ? (
                    <a
                      href={book.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center gap-2 rounded-md bg-forest px-3 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5"
                    >
                      <Download className="size-4" /> Descargar
                    </a>
                  ) : null}
                  {book.externalUrl ? (
                    <a
                      href={book.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-sm font-semibold text-ink-soft"
                    >
                      <ExternalLink className="size-4" /> Consultar
                    </a>
                  ) : null}
                  {book.commerceUrl ? (
                    <a
                      href={book.commerceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center gap-2 rounded-md border border-clay/25 bg-clay/10 px-3 text-sm font-semibold text-clay"
                    >
                      <ShoppingCart className="size-4" /> {book.kind === "Venta" ? "Ver venta" : "Comprar"}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </Card>
          ))}

          {!visible.length ? (
            <Card className="md:col-span-2">
              <p className="text-sm text-muted">No hay recursos que coincidan con esta búsqueda.</p>
            </Card>
          ) : null}
        </div>

        <PublishGate area="biblioteca">
          <div className="lg:sticky lg:top-6">
            <FormBox title="Crear ficha / subir libro" onSubmit={onSubmit}>
              <div className="rounded-lg border border-forest/10 bg-forest-soft p-3 text-xs leading-relaxed text-ink-soft">
                <span className="font-semibold text-forest">Bibliografía + archivo.</span> Puedes publicar sólo la referencia o adjuntar un PDF/EPUB. Comparte únicamente material que tengas derecho a distribuir.
              </div>

              <Field label="Título">
                <Input name="title" required maxLength={300} placeholder="Introducción al estudio del derecho" />
              </Field>
              <Field label="Autor">
                <Input name="author" required maxLength={400} placeholder="Eduardo García Máynez o H. Congreso de la Unión" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo">
                  <Select name="kind" defaultValue="Bibliografía">
                    <option>Bibliografía</option>
                    <option>Descarga</option>
                    <option>Préstamo</option>
                    <option>Venta</option>
                    <option>Recomendación</option>
                  </Select>
                </Field>
                <Field label="Materia">
                  <Select name="course" defaultValue="">
                    <option value="">General</option>
                    {courses.map((course) => <option key={course.id}>{course.name}</option>)}
                  </Select>
                </Field>
              </div>

              <div className="border-t border-line pt-3">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Datos bibliográficos</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <Field label="Editorial">
                    <Input name="publisher" maxLength={240} placeholder="Porrúa" />
                  </Field>
                  <Field label="Año">
                    <Input name="publicationYear" maxLength={40} placeholder="2026" />
                  </Field>
                  <Field label="Edición">
                    <Input name="edition" maxLength={240} placeholder="18.ª edición" />
                  </Field>
                  <Field label="ISBN">
                    <Input name="isbn" maxLength={80} placeholder="978-…" />
                  </Field>
                </div>
              </div>

              <Field label="Archivo PDF o EPUB" hint="máx. 100 MB">
                <Input name="bookFile" type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" />
              </Field>
              {uploadProgress !== null ? (
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted"><span>Subiendo archivo</span><span>{uploadProgress}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-clay transition-[width]" style={{ width: `${uploadProgress}%` }} /></div>
                </div>
              ) : null}

              <Field label="Liga de consulta/descarga" hint="opcional">
                <Input name="externalUrl" type="text" inputMode="url" maxLength={1500} placeholder="dof.gob.mx/... o https://…" />
              </Field>
              <Field label="Liga para compra o venta" hint="opcional">
                <Input name="commerceUrl" type="text" inputMode="url" maxLength={1500} placeholder="https://…" />
              </Field>
              <Field label="Precio" hint="opcional">
                <Input name="priceText" maxLength={120} placeholder="$350 MXN / A convenir" />
              </Field>
              <Field label="Notas">
                <Textarea name="notes" maxLength={1800} placeholder="Capítulos recomendados, vigencia, reformas, estado físico, instrucciones de préstamo…" />
              </Field>
              <Field label="Alias / responsable">
                <Input name="ownerAlias" maxLength={160} placeholder="Biblioteca 9114" />
              </Field>

              {error ? <p className="text-sm text-danger">{error}</p> : null}
              {success ? <p className="text-sm font-medium text-forest">{success}</p> : null}
              <Button type="submit" disabled={busy}>
                {busy ? <><UploadCloud className="mr-2 size-4 animate-pulse" />Publicando…</> : <><FileText className="mr-2 size-4" />Publicar recurso</>}
              </Button>
            </FormBox>
          </div>
        </PublishGate>
      </div>
    </Shell>
  );
}

function LibraryStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2">
      <p className="font-display text-2xl leading-none">{value}</p>
      <p className="mt-1 text-[10px] text-bg/55">{label}</p>
    </div>
  );
}
