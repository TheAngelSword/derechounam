import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { NewsSection } from "@/components/news";
export const Route=createFileRoute("/noticias")({component:NewsPage});
function NewsPage(){return <Shell eyebrow="ACTUALIDAD · FUENTES OFICIALES" title="Entender lo que cambia." lead="Noticias de la Facultad, avisos de Universidad Abierta y actualidad jurídica. Cada publicación conserva su fuente y su contexto."><NewsSection full/></Shell>;}
