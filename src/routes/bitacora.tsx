import { createFileRoute } from "@tanstack/react-router";
import { Camera, ImagePlus, MapPin, UploadCloud } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useRefreshBoard } from "@/components/board-context";
import { useAreaVisit } from "@/components/directory";
import { Button, Card, Field, FormBox, Input, Pill, Textarea } from "@/components/ui";
import { PublishGate } from "@/components/publish-gate";
import { addBitacoraPost } from "@/lib/content";

export const Route = createFileRoute("/bitacora")({ component: BitacoraPage });

function safeUploadName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(-140) || "bitacora.jpg";
}

function formatPostDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function BitacoraPage() {
  const { posts } = useBoard();
  const refresh = useRefreshBoard();
  useAreaVisit("bitacora");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    setUploadProgress(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const body = String(data.get("body") ?? "").trim();
    const place = String(data.get("place") ?? "").trim();
    const shotDate = String(data.get("shotDate") ?? "").trim();
    const file = data.get("photo");

    if (title.length < 2 || body.length < 3) {
      setError("La publicación necesita título y una descripción breve.");
      setBusy(false);
      return;
    }

    let imageUrl = "";
    let imageName = "";

    try {
      if (!(file instanceof File) || file.size === 0) {
        throw new Error("Selecciona una foto para la bitácora.");
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        throw new Error("La imagen debe ser JPG, PNG o WEBP.");
      }
      if (file.size > 20 * 1024 * 1024) {
        throw new Error("La imagen supera el límite de 20 MB.");
      }

      const { uploadPresigned } = await import("@vercel/blob/client");
      const blob = await uploadPresigned(`bitacora/${Date.now()}-${safeUploadName(file.name)}`, file, {
        access: "public",
        handleUploadUrl: "/api/bitacora-upload",
        multipart: true,
        onUploadProgress: ({ percentage }) => setUploadProgress(Math.round(percentage)),
      });
      imageUrl = blob.downloadUrl || blob.url;
      imageName = file.name;

      await addBitacoraPost({
        data: {
          title,
          body,
          imageUrl,
          imageName,
          place,
          shotDate,
        },
      });

      form.reset();
      setUploadProgress(null);
      setSuccess("Foto publicada en la bitácora.");
      await refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo publicar la foto.";
      if (/blob|signed|oidc|store|token/i.test(message)) {
        setError("No se pudo subir la imagen. Revisa que Vercel Blob esté conectado al proyecto.");
      } else if (/authorized|padrón|unauthorized/i.test(message)) {
        setError("Debes iniciar sesión y estar activo en el padrón para publicar.");
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      eyebrow="Bitácora · Grupo 9114"
      title="Fotos, evidencias y momentos de clase."
      lead="La bitácora sirve para publicar fotos del salón, actividades, avisos visuales y recuerdos del grupo 9114."
    >
      <Card className="hero-glow animated-orb mb-6 bg-forest text-bg" interactive>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-bg/65">
              <Camera className="size-4" /> Bitácora visual del grupo
            </div>
            <h2 className="mt-2 font-display text-3xl">Publicaciones con foto para la comunidad.</h2>
            <p className="mt-2 max-w-2xl text-sm text-bg/75">Cada entrada puede llevar imagen, descripción, fecha y ubicación. Ideal para compartir fotos de clase, exposiciones, materiales del pizarrón o actividades del día.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-bg/55">Entradas</p>
              <p className="mt-1 font-display text-3xl">{posts.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-bg/55">Con foto</p>
              <p className="mt-1 font-display text-3xl">{posts.filter((post) => Boolean(post.imageUrl)).length}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
        <div className="stagger-children grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <Card key={post.id} interactive className="soft-raise overflow-hidden p-0">
              {post.imageUrl ? (
                <img src={post.imageUrl} alt={post.title} className="h-56 w-full object-cover" />
              ) : (
                <div className="grid h-56 place-items-center bg-forest-soft text-forest">
                  <div className="text-center">
                    <ImagePlus className="mx-auto size-9" />
                    <p className="mt-2 text-sm font-medium">Entrada sin foto de ejemplo</p>
                  </div>
                </div>
              )}
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="forest">Bitácora</Pill>
                  {post.place ? <Pill>{post.place}</Pill> : null}
                </div>
                <h2 className="mt-3 font-display text-2xl leading-tight">{post.title}</h2>
                <p className="mt-2 text-sm text-muted">{post.body}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                  <span>{post.authorAlias}</span>
                  <span>{formatPostDate(post.createdAt)}</span>
                  {post.shotDate ? <span>Foto: {post.shotDate}</span> : null}
                  {post.place ? <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{post.place}</span> : null}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <PublishGate area="bitacora">
          <FormBox title="Nueva entrada de bitácora" onSubmit={onSubmit}>
            <Field label="Título">
              <Input name="title" required placeholder="Exposición de romano" />
            </Field>
            <Field label="Descripción">
              <Textarea name="body" required placeholder="Foto del pizarrón, actividad o momento de la clase." />
            </Field>
            <Field label="Lugar" hint="Opcional">
              <Input name="place" placeholder="D-106" />
            </Field>
            <Field label="Fecha de la foto" hint="Opcional">
              <Input name="shotDate" type="date" />
            </Field>
            <Field label="Foto de la clase" hint="JPG, PNG o WEBP · máximo 20 MB">
              <Input name="photo" type="file" accept="image/png,image/jpeg,image/webp" required />
            </Field>
            {uploadProgress !== null ? <p className="text-sm text-muted">Subiendo imagen: {uploadProgress}%</p> : null}
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            {success ? <p className="text-sm text-forest">{success}</p> : null}
            <Button type="submit" disabled={busy} className="gap-2">
              <UploadCloud className="size-4" />
              {busy ? "Publicando…" : "Publicar en bitácora"}
            </Button>
          </FormBox>
        </PublishGate>
      </div>
    </Shell>
  );
}
