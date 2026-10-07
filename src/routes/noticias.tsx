import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { NewsSection } from "@/components/news";
export const Route=createFileRoute("/noticias")({component:()=> <Shell eyebrow="ACTUALIDAD · FUENTES OFICIALES" title="Todas las noticias" lead="Facultad, Universidad Abierta, legislación y justicia. Todas las publicaciones disponibles, con su fecha y su fuente."><NewsSection full/></Shell>});
