import { createFileRoute } from "@tanstack/react-router";
import { Coffee, MapPin, Sandwich, ShoppingBag, Sparkles, TimerReset, UploadCloud, UtensilsCrossed } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useBoard, useRefreshBoard } from "@/components/board-context";
import { useAreaVisit } from "@/components/directory";
import { Button, Card, Field, FormBox, Input, Pill, Select, Textarea, cn } from "@/components/ui";
import { PublishGate } from "@/components/publish-gate";
import { addServiceOffer } from "@/lib/content";
import { uploadToAtrioMedia } from "@/lib/media-upload";

export const Route = createFileRoute("/servicios")({ component: ServiciosPage });

const CATEGORIES = ["Todos", "Desayuno", "Comida", "Sándwiches", "Postres", "Bebidas", "Otro"] as const;
type Category = Exclude<(typeof CATEGORIES)[number], "Todos">;


function categoryIcon(category: string) {
  if (category === "Sándwiches") return Sandwich;
  if (category === "Bebidas") return Coffee;
  if (category === "Desayuno" || category === "Comida") return UtensilsCrossed;
  return ShoppingBag;
}

function ServiciosPage() {
  const { services } = useBoard();
  const refresh = useRefreshBoard();
  useAreaVisit("servicios");
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("Todos");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const visible = useMemo(
    () => services.filter((item) => filter === "Todos" || item.category === filter),
    [services, filter],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    setUploadProgress(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("photo");
    let imageUrl = "";
    let imageName = "";

    try {
      if (file instanceof File && file.size > 0) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          throw new Error("La foto debe ser JPG, PNG o WEBP.");
        }
        if (file.size > 15 * 1024 * 1024) throw new Error("La imagen supera 15 MB.");
        const now = new Date();
        const stored = await uploadToAtrioMedia({
          file,
          category: "servicios",
          subfolder: `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`,
          onProgress: setUploadProgress,
        });
        imageUrl = stored.url;
        imageName = file.name;
      }

      await addServiceOffer({
        data: {
          title: String(data.get("title") ?? "").trim(),
          category: String(data.get("category") ?? "Otro") as Category,
          description: String(data.get("description") ?? "").trim(),
          priceText: String(data.get("priceText") ?? "").trim(),
          availabilityDays: String(data.get("availabilityDays") ?? "").trim(),
          deliveryPlace: String(data.get("deliveryPlace") ?? "").trim(),
          orderCutoff: String(data.get("orderCutoff") ?? "").trim(),
          howToOrder: String(data.get("howToOrder") ?? "").trim(),
          imageUrl,
          imageName,
        },
      });

      form.reset();
      setUploadProgress(null);
      setSuccess("Servicio publicado para el grupo.");
      await refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo publicar.";
      if (/ge01|servidor de archivos|autorizar|subida|media/i.test(message)) {
        setError(`No se pudo subir la foto a ge01.com. ${message}`);
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
      eyebrow="Servicios · Grupo 9114"
      title="Comida, encargos y servicios entre compañeros."
      lead="Un espacio interno para ofrecer desayunos, comidas, sándwiches, postres, bebidas u otros servicios y entregarlos durante los días de clase."
    >
      <Card className="unam-hero-card animated-orb hero-glow mb-6" interactive>
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-bg/65">
              <Sparkles className="size-4" /> Mercado interno 9114
            </div>
            <h2 className="mt-2 font-display text-3xl">Pide hoy y recibe en clase.</h2>
            <p className="mt-2 max-w-2xl text-sm text-bg/75">Cada publicación puede indicar precio, días disponibles, dónde se entrega y hasta qué hora hay que hacer el pedido.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.08] px-5 py-4 text-center">
            <p className="text-xs uppercase tracking-[0.12em] text-bg/55">Publicaciones</p>
            <p className="mt-1 font-display text-4xl">{services.length}</p>
          </div>
        </div>
      </Card>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
              filter === category
                ? "bg-forest text-bg shadow-sm"
                : "border border-line bg-surface text-ink-soft hover:-translate-y-0.5 hover:border-forest/30",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <div className="stagger-children grid content-start gap-4 md:grid-cols-2">
          {visible.map((service) => {
            const Icon = categoryIcon(service.category);
            return (
              <Card key={service.id} interactive className="motion-sheen group soft-raise overflow-hidden p-0">
                {service.imageUrl ? (
                  <div className="relative h-52 overflow-hidden">
                    <img src={service.imageUrl} alt={service.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                    <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-forest shadow-sm">{service.priceText}</span>
                  </div>
                ) : (
                  <div className="relative grid h-40 place-items-center overflow-hidden bg-gradient-to-br from-forest-soft to-white text-forest">
                    <div className="absolute -right-8 -top-8 size-32 rounded-full bg-clay/15 blur-2xl" />
                    <Icon className="size-10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
                    <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-sm font-bold text-forest shadow-sm">{service.priceText}</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="forest">{service.category}</Pill>
                    <span className="text-xs text-muted">Ofrece: {service.sellerAlias}</span>
                  </div>
                  <h2 className="mt-3 font-display text-2xl leading-tight">{service.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{service.description}</p>
                  <div className="mt-4 grid gap-2 rounded-lg bg-bg-warm/75 p-3 text-sm text-ink-soft">
                    <p className="inline-flex items-start gap-2"><UtensilsCrossed className="mt-0.5 size-4 shrink-0 text-forest" />{service.availabilityDays}</p>
                    <p className="inline-flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-forest" />{service.deliveryPlace}</p>
                    {service.orderCutoff ? <p className="inline-flex items-start gap-2"><TimerReset className="mt-0.5 size-4 shrink-0 text-forest" />Pedir antes de: {service.orderCutoff}</p> : null}
                  </div>
                  <p className="mt-4 text-sm"><span className="font-semibold text-forest">Cómo pedir:</span> {service.howToOrder}</p>
                </div>
              </Card>
            );
          })}
          {!visible.length ? <Card><p className="text-sm text-muted">Todavía no hay publicaciones en esta categoría.</p></Card> : null}
        </div>

        <PublishGate area="servicios">
          <FormBox title="Publicar un servicio" onSubmit={onSubmit}>
            <Field label="Qué ofreces">
              <Input name="title" required placeholder="Sándwich de pollo + fruta" />
            </Field>
            <Field label="Categoría">
              <Select name="category" defaultValue="Desayuno">
                {CATEGORIES.filter((item) => item !== "Todos").map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Field>
            <Field label="Descripción">
              <Textarea name="description" required placeholder="Qué incluye, tamaño, opciones o ingredientes importantes." />
            </Field>
            <Field label="Precio">
              <Input name="priceText" required placeholder="$65" />
            </Field>
            <Field label="Días disponibles">
              <Input name="availabilityDays" required placeholder="Lunes, miércoles y viernes" />
            </Field>
            <Field label="Lugar de entrega">
              <Input name="deliveryPlace" required placeholder="Entrada de D-106" />
            </Field>
            <Field label="Hora límite para pedir" hint="Opcional">
              <Input name="orderCutoff" placeholder="21:00 del día anterior" />
            </Field>
            <Field label="Cómo pedir">
              <Textarea name="howToOrder" required placeholder="Escríbeme en el grupo / apartar antes de las 9 pm." />
            </Field>
            <Field label="Foto" hint="Opcional · JPG/PNG/WEBP">
              <Input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
            </Field>
            {uploadProgress !== null ? <p className="text-sm text-muted">Subiendo foto: {uploadProgress}%</p> : null}
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            {success ? <p className="text-sm text-forest">{success}</p> : null}
            <Button type="submit" disabled={busy} className="gap-2"><UploadCloud className="size-4" />{busy ? "Publicando…" : "Publicar servicio"}</Button>
          </FormBox>
        </PublishGate>
      </div>
    </Shell>
  );
}
