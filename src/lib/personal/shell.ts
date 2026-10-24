import { createIsomorphicFn } from "@tanstack/react-start";
import { isPersonalSite, originOf } from "./hosts";
import { requestSite } from "./request.server";

export type SiteShell = { personal: boolean; portalUrl: string | null };

/**
 * Host check without a server-function round trip. Awaiting `siteShell()` from
 * the root delayed session render and the public pages hydrated as a guest on
 * the server and as a signed-in user in the browser.
 */
export const readShell = createIsomorphicFn()
  .server((): SiteShell => requestSite())
  .client((): SiteShell => {
    const personal = isPersonalSite(window.location.host, {
      SITE_MODE: import.meta.env.VITE_SITE_MODE,
      PERSONAL_PUBLIC_URL: import.meta.env.VITE_PERSONAL_HOSTNAME ? `https://${import.meta.env.VITE_PERSONAL_HOSTNAME}` : undefined,
    });
    return { personal, portalUrl: personal ? originOf(import.meta.env.VITE_PORTAL_PUBLIC_URL) : null };
  });
