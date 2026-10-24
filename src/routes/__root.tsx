import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Outlet, Scripts, notFound, redirect } from "@tanstack/react-router";
import { isPersonalSite, isPortalPage } from "@/lib/personal/hosts";
import { siteShell } from "@/lib/personal/functions";
import { useState } from "react";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AuthProvider } from "@/lib/auth/provider";
import { AccessVisitTracker } from "@/components/access-visit-tracker";
import appCss from "../styles.css?url";
import updateCss from "../styles-v71.css?url";
import layoutCss from "../styles-v72.css?url";
import gamesCss from "../styles-v73.css?url";
import auraCss from "../styles-v74.css?url";
import aura75Css from "../styles-v75.css?url";
import personalCss from "../styles-personal.css?url";

const APP_NAME = "Facultad de Derecho";
type SiteShell = { personal: boolean; portalUrl: string | null };
let browserShell: SiteShell | undefined;

function clientLooksPersonal(): boolean | null {
 if (typeof window === "undefined") return null;
 const mode = String(import.meta.env.VITE_SITE_MODE ?? "").trim().toLowerCase();
 const host = String(import.meta.env.VITE_PERSONAL_HOSTNAME ?? "").trim();
 if (mode !== "personal" && !host) return null;
 return isPersonalSite(window.location.host, { SITE_MODE: mode || undefined, PERSONAL_PUBLIC_URL: host ? `https://${host}` : undefined });
}

async function currentShell(): Promise<SiteShell> {
 if (typeof window !== "undefined" && browserShell) return browserShell;
 if (clientLooksPersonal() === false) {
  browserShell = { personal: false, portalUrl: null };
  return browserShell;
 }
 const site = await siteShell();
 if (typeof window !== "undefined") browserShell = site;
 return site;
}

export const Route = createRootRoute({
 beforeLoad: async ({ location }) => {
  if (!isPortalPage(location.pathname)) return;
  const site = await currentShell();
  if (!site.personal) return;
  if (site.portalUrl) throw redirect({ href: `${site.portalUrl}${location.pathname}` });
  throw notFound();
 },
 head: async () => {
  const site = await currentShell();
  const meta = [
   { charSet: "utf-8" },
   { name: "viewport", content: "width=device-width, initial-scale=1" },
   { title: site.personal ? "pnota · espacio personal" : APP_NAME },
   { name: "description", content: site.personal ? "Agenda privada del titular. Las tareas y recordatorios no se comparten con el grupo." : "Portal estudiantil del grupo 9114: plan de estudios 2125, noticias de Derecho y Universidad Abierta, materiales en Drive, horarios y comunidad. No es un sitio oficial de la UNAM." },
   { name: "theme-color", content: "#002B7A" },
   ...(site.personal ? [{ name: "robots", content: "noindex, nofollow" }] : []),
  ];
  const links = [
   { rel: "icon", type: "image/webp", href: "/brand/justicia-emblema.webp" },
   { rel: "stylesheet", href: appCss },
   { rel: "stylesheet", href: updateCss },
   { rel: "stylesheet", href: layoutCss },
   { rel: "stylesheet", href: gamesCss },
   { rel: "stylesheet", href: auraCss },
   { rel: "stylesheet", href: aura75Css },
   ...(site.personal ? [{ rel: "stylesheet", href: personalCss }] : []),
   { rel: "manifest", href: "/__grok/manifest.webmanifest" },
   { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
   { rel: "preconnect", href: "https://fonts.googleapis.com" },
   { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" as const },
   { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap" },
  ];
  return { meta, links };
 },
 component: RootDocument,
});
function RootDocument() {
 const [client] = useState(() => new QueryClient({defaultOptions:{queries:{staleTime:15_000,refetchOnWindowFocus:false}}}));
 return <html lang="es" className="antialiased" suppressHydrationWarning><head><HeadContent/></head><body><PreviewHostBridge/><AuthProvider><QueryClientProvider client={client}><AccessVisitTracker/><Outlet/></QueryClientProvider></AuthProvider><Scripts/></body></html>;
}
