import type { LucideIcon } from "lucide-react";
import {
  Anchor, Banknote, BadgeCheck, BookOpen, Briefcase, Building2, CalendarDays, ClipboardList, Clock, Coins, Copyright,
  Cpu, Droplets, FileText, Fingerprint, Gavel, Globe, GraduationCap, HandHeart, Handshake, HardHat, HeartPulse, Landmark,
  Leaf, Library, Lightbulb, Lock, Megaphone, Microscope, Palette, PawPrint, Plane, Scale, ScrollText, Search, Ship,
  ShieldAlert, ShieldCheck, Sprout, Stamp, Stethoscope, Tractor, TrendingUp, Users, Vote, Wheat, Wifi,
} from "lucide-react";
import { newsTopic, stableHash, type NewsTopic } from "@/lib/news/topics";

type Art = { label: string; from: string; to: string; accent: string; icons: [LucideIcon, LucideIcon, LucideIcon] };
/** One illustration per legal topic: colours and drawings chosen to match what the headline is about. */
const ART: Record<NewsTopic, Art> = {
  agrario: { label: "DERECHO AGRARIO", from: "#14321d", to: "#3d4c17", accent: "#E8C86A", icons: [Wheat, Tractor, Sprout] },
  electoral: { label: "MATERIA ELECTORAL", from: "#221848", to: "#47307c", accent: "#F2C75E", icons: [Vote, Landmark, Users] },
  penal: { label: "DERECHO PENAL Y SEGURIDAD", from: "#2a1116", to: "#5b1d25", accent: "#F2B27C", icons: [ShieldAlert, Fingerprint, Lock] },
  corte: { label: "SUPREMA CORTE Y CONSTITUCIÓN", from: "#071d45", to: "#1a3c77", accent: "#D9A520", icons: [Landmark, Scale, Gavel] },
  sentencia: { label: "RESOLUCIONES JUDICIALES", from: "#111d36", to: "#2c4166", accent: "#E4C47C", icons: [Gavel, Scale, ScrollText] },
  legislacion: { label: "LEGISLACIÓN", from: "#391323", to: "#6c2542", accent: "#F2D98E", icons: [ScrollText, Stamp, FileText] },
  etica: { label: "ÉTICA Y TRANSPARENCIA", from: "#0e2e39", to: "#1e5862", accent: "#9FE2D2", icons: [ShieldCheck, BadgeCheck, Search] },
  convenio: { label: "CONVENIOS Y ACUERDOS", from: "#11304a", to: "#1f5b6c", accent: "#F2D98E", icons: [Handshake, FileText, Building2] },
  economia: { label: "ECONOMÍA Y FINANZAS PÚBLICAS", from: "#0e2d29", to: "#1c5349", accent: "#EAC66B", icons: [Coins, TrendingUp, Banknote] },
  tecnologia: { label: "CIENCIA Y TECNOLOGÍA", from: "#0a2140", to: "#12406d", accent: "#82D9F5", icons: [Cpu, Wifi, Microscope] },
  salud: { label: "SALUD", from: "#0f314a", to: "#1d5e70", accent: "#92E4D2", icons: [HeartPulse, Stethoscope, ShieldCheck] },
  derechos: { label: "DERECHOS HUMANOS E IGUALDAD", from: "#35163e", to: "#612962", accent: "#F6BBD3", icons: [HandHeart, Users, Scale] },
  trabajo: { label: "DERECHO DEL TRABAJO", from: "#2d2311", to: "#5b4419", accent: "#F2C66D", icons: [Briefcase, HardHat, Clock] },
  ambiente: { label: "MEDIO AMBIENTE", from: "#0e3223", to: "#1f5f3c", accent: "#ABE28E", icons: [Leaf, Droplets, PawPrint] },
  academia: { label: "VIDA ACADÉMICA", from: "#071d45", to: "#24356d", accent: "#F2D98E", icons: [GraduationCap, BookOpen, Library] },
  internacional: { label: "DERECHO INTERNACIONAL", from: "#0c2944", to: "#1b5074", accent: "#A2D2F1", icons: [Globe, Plane, Handshake] },
  maritimo: { label: "PUERTOS Y MARINA", from: "#05233e", to: "#0f4b6c", accent: "#92D5F2", icons: [Anchor, Ship, Globe] },
  administracion: { label: "ADMINISTRACIÓN PÚBLICA", from: "#192537", to: "#34485f", accent: "#D8C18C", icons: [Building2, ClipboardList, Users] },
  propiedad: { label: "CULTURA Y PROPIEDAD INTELECTUAL", from: "#2b193c", to: "#4f3064", accent: "#F2C870", icons: [Palette, Copyright, Lightbulb] },
  registro: { label: "REGISTRO E IDENTIDAD", from: "#132939", to: "#25516b", accent: "#D0E4A9", icons: [Fingerprint, ClipboardList, Stamp] },
  facultad: { label: "VIDA EN LA FACULTAD", from: "#071d45", to: "#163568", accent: "#D59F0F", icons: [Landmark, GraduationCap, Users] },
  abierta: { label: "UNIVERSIDAD ABIERTA", from: "#0f333a", to: "#1f5c5f", accent: "#C6E2DE", icons: [GraduationCap, Wifi, BookOpen] },
  comunidad: { label: "COMUNIDAD", from: "#132a44", to: "#29495c", accent: "#D8C392", icons: [Users, Megaphone, CalendarDays] },
};

/** Three compositions; the headline picks one so neighbouring cards of the same topic do not look identical. */
const LAYOUTS = [
  { main: [245, 62, 150], a: [92, 150, 72], b: [476, 150, 72], label: [320, 344, "middle"] },
  { main: [86, 74, 170], a: [400, 120, 84], b: [516, 196, 60], label: [576, 344, "end"] },
  { main: [384, 74, 170], a: [70, 196, 60], b: [170, 120, 84], label: [320, 344, "middle"] },
] as const;

export function NewsArt({ item }: { item: { id?: string; title: string; summary?: string | null; category: string } }) {
  const topic = newsTopic(item);
  const art = ART[topic];
  const hash = stableHash(item.id ?? item.title);
  const layout = LAYOUTS[hash % LAYOUTS.length];
  const pattern = (hash >>> 3) % 3;
  const gid = `fd-art-${hash.toString(36)}`;
  const [Main, A, B] = art.icons;
  const [mx, my, ms] = layout.main;
  return (
    <svg className="fd-news-illustration" viewBox="0 0 640 380" role="img" aria-label={`Ilustración de referencia: ${art.label.toLowerCase()}. No es una fotografía del suceso.`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={art.from} />
          <stop offset="1" stopColor={art.to} />
        </linearGradient>
      </defs>
      <rect width="640" height="380" fill={`url(#${gid})`} />
      {pattern === 0 ? (
        <g fill="none" stroke={art.accent}>
          <circle cx="570" cy="40" r="200" strokeOpacity=".18" />
          <circle cx="570" cy="40" r="160" strokeOpacity=".1" />
          <circle cx="60" cy="360" r="120" strokeOpacity=".08" />
        </g>
      ) : pattern === 1 ? (
        <g fill={art.accent} fillOpacity=".12">
          {Array.from({ length: 12 * 7 }, (_, i) => <circle key={i} cx={32 + (i % 12) * 52} cy={30 + Math.floor(i / 12) * 52} r="1.8" />)}
        </g>
      ) : (
        <g stroke={art.accent} strokeOpacity=".08">
          {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${i * 60 - 200} 380 L${i * 60 + 180} 0`} />)}
        </g>
      )}
      <circle cx={mx + ms / 2} cy={my + ms / 2} r={ms * 0.72} fill={art.accent} fillOpacity=".07" />
      <Main x={mx} y={my} width={ms} height={ms} color={art.accent} strokeWidth={0.9} />
      <A x={layout.a[0]} y={layout.a[1]} width={layout.a[2]} height={layout.a[2]} color={art.accent} strokeWidth={1.1} opacity={0.42} />
      <B x={layout.b[0]} y={layout.b[1]} width={layout.b[2]} height={layout.b[2]} color={art.accent} strokeWidth={1.1} opacity={0.3} />
      <text x={layout.label[0]} y={layout.label[1]} textAnchor={layout.label[2]} fill={art.accent} fontSize="17" letterSpacing="3" fontFamily="sans-serif" fontWeight="600">{art.label}</text>
    </svg>
  );
}
