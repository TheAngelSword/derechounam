import { createFileRoute } from "@tanstack/react-router";
import { Camera, ImagePlus, MapPin, Pencil, UploadCloud, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useRefreshBoard } from "@/components/board-context";
import { canEditPublication, useAreaVisit, useDirectory } from "@/components/directory";
import { Button, Card, Field, FormBox, Input, Pill, Textarea } from "@/components/ui";
import { PublishGate } from "@/components/publish-gate";
import { addBitacoraPost, updateBitacoraPost } from "@/lib/content";
import { uploadToAtrioMedia } from "@/lib/media-upload";
import type { BitacoraPost } from "@/lib/types";

export const Route = createFileRoute("/bitacora")({ component: BitacoraPage });

function formatPostDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function BitacoraPage() {
  const { posts } = useBoard();
  const refresh = useRefreshBoard();
  const { user, directory } = useDirectory();
  useAreaVisit("bitacora");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingPost, setEditingPost] = useState<BitacoraPost | null>(null);

  async function uploadPhoto(file: FormDataEntryValue | null) {
    if (!(file instanceof File) || file.size === 0) return null;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("La imagen debe ser JPG, PNG o WEBP.");
    if (file.size > 20 * 1024 * 1024) throw new Error("La imagen supera el límite de 20 MB.");
    const now = new Date();
    const stored = await uploadToAtrioMedia({ file, category: "bitacora", subfolder: `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`, onProgress: setUploadProgress });
    return { url: stored.url, name: file.name };
  }

  function readPost(data: FormData) {
    return {
      title: String(data.get("title") ?? "").trim(),
      body: String(data.get("body") ?? "").trim(),
      place: String(data.get("place") ?? "").trim(),
      shotDate: String(data.get("shotDate") ?? "").trim(),
    };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setSuccess(null); setBusy(true); setUploadProgress(null);
    const form = event.currentTarget; const data = new FormData(form); const values = readPost(data);
    try {
      if (values.title.length < 2 || values.body.length < 3) throw new Error("La publicación necesita título y una descripción breve.");
      const uploaded = await uploadPhoto(data.get("photo"));
      if (!uploaded) throw new Error("Selecciona una foto para la bitácora.");
      await addBitacoraPost({ data: { ...values, imageUrl: uploaded.url, imageName: uploaded.name } });
      form.reset(); setSuccess("Foto publicada en la bitácora."); await refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo publicar la foto.";
      setError(/autor de la publicación|administrador/i.test(message) ? "Sólo el autor o un administrador puede editar esta entrada." : message);
    } finally { setBusy(false); }
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editingPost) return;
    setError(null); setSuccess(null); setBusy(true); setUploadProgress(null);
    const data = new FormData(event.currentTarget); const values = readPost(data);
    try {
      const uploaded = await uploadPhoto(data.get("photo"));
      await updateBitacoraPost({ data: { id: editingPost.id, ...values, imageUrl: uploaded?.url ?? editingPost.imageUrl ?? "", imageName: uploaded?.name ?? editingPost.imageName ?? "" } });
      setEditingPost(null); setSuccess("Entrada de bitácora actualizada."); await refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo guardar.";
      setError(/autor de la publicación|administrador/i.test(message) ? "Sólo el autor o un administrador puede editar esta entrada." : message);
    } finally { setBusy(false); }
  }

  return (
    <Shell eyebrow="Bitácora · Grupo 9114" title="Fotos, evidencias y momentos de clase." lead="La bitácora sirve para publicar fotos del salón, actividades, avisos visuales y recuerdos del grupo 9114.">
      <Card className="unam-hero-card hero-glow animated-orb mb-6" interactive>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-bg/65"><Camera className="size-4" /> Bitácora visual del grupo</div><h2 className="mt-2 font-display text-3xl">Publicaciones con foto para la comunidad.</h2><p className="mt-2 max-w-2xl text-sm text-bg/75">Cada entrada puede llevar imagen, descripción, fecha y ubicación.</p></div>
          <div className="grid grid-cols-2 gap-2 text-center"><div className="rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3"><p className="text-xs uppercase tracking-[0.12em] text-bg/55">Entradas</p><p className="mt-1 font-display text-3xl">{posts.length}</p></div><div className="rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3"><p className="text-xs uppercase tracking-[0.12em] text-bg/55">Con foto</p><p className="mt-1 font-display text-3xl">{posts.filter((post) => Boolean(post.imageUrl)).length}</p></div></div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
        <div className="stagger-children grid gap-4 md:grid-cols-2">
          {posts.map((post) => {
            const editable = canEditPublication(directory, user?.id, post.createdBy);
            return <Card key={post.id} interactive className="soft-raise overflow-hidden p-0">
              {post.imageUrl ? <img src={post.imageUrl} alt={post.title} className="h-56 w-full object-cover" /> : <div className="grid h-56 place-items-center bg-forest-soft text-forest"><div className="text-center"><ImagePlus className="mx-auto size-9" /><p className="mt-2 text-sm font-medium">Entrada sin foto de ejemplo</p></div></div>}
              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap gap-2"><Pill tone="forest">Bitácora</Pill>{post.place ? <Pill>{post.place}</Pill> : null}</div>{editable ? <button type="button" onClick={() => { setEditingPost(post); setError(null); setSuccess(null); }} className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-forest"><Pencil className="size-3.5" />Editar</button> : null}</div>
                <h2 className="mt-3 font-display text-2xl leading-tight">{post.title}</h2><p className="mt-2 text-sm text-muted">{post.body}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted"><span>{post.authorAlias}</span><span>{formatPostDate(post.createdAt)}</span>{post.shotDate ? <span>Foto: {post.shotDate}</span> : null}{post.place ? <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{post.place}</span> : null}</div>
              </div>
            </Card>;
          })}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          {editingPost ? <FormBox title="Editar entrada" onSubmit={onEdit}>
            <div className="flex items-center justify-between rounded-lg bg-clay/10 p-3 text-xs"><span>Puedes cambiar texto, fecha, lugar o reemplazar la foto.</span><button type="button" onClick={() => setEditingPost(null)} className="inline-flex items-center gap-1 font-semibold text-forest"><X className="size-3.5" />Cancelar</button></div>
            <BitacoraFields post={editingPost} editMode />
            {uploadProgress !== null ? <p className="text-sm text-muted">Subiendo imagen: {uploadProgress}%</p> : null}{error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" disabled={busy} className="gap-2"><Pencil className="size-4" />{busy ? "Guardando…" : "Guardar cambios"}</Button>
          </FormBox> : <PublishGate area="bitacora"><FormBox title="Nueva entrada de bitácora" onSubmit={onSubmit}><BitacoraFields />{uploadProgress !== null ? <p className="text-sm text-muted">Subiendo imagen: {uploadProgress}%</p> : null}{error ? <p className="text-sm text-danger">{error}</p> : null}{success ? <p className="text-sm text-forest">{success}</p> : null}<Button type="submit" disabled={busy} className="gap-2"><UploadCloud className="size-4" />{busy ? "Publicando…" : "Publicar en bitácora"}</Button></FormBox></PublishGate>}
        </div>
      </div>
    </Shell>
  );
}

function BitacoraFields({ post, editMode = false }: { post?: BitacoraPost; editMode?: boolean }) {
  return <><Field label="Título"><Input name="title" required defaultValue={post?.title ?? ""} placeholder="Exposición de romano" /></Field><Field label="Descripción"><Textarea name="body" required defaultValue={post?.body ?? ""} placeholder="Foto del pizarrón, actividad o momento de la clase." /></Field><Field label="Lugar" hint="Opcional"><Input name="place" defaultValue={post?.place ?? ""} placeholder="D-106" /></Field><Field label="Fecha de la foto" hint="Opcional"><Input name="shotDate" type="date" defaultValue={post?.shotDate ?? ""} /></Field><Field label={editMode ? "Reemplazar foto" : "Foto de la clase"} hint={editMode ? "Opcional; si no eliges otra se conserva" : "JPG, PNG o WEBP · máximo 20 MB"}><Input name="photo" type="file" accept="image/png,image/jpeg,image/webp" required={!editMode} /></Field></>;
}
