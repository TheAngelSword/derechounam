import { getRequest } from "@tanstack/react-start/server";
import { hostFromHeader, isPersonalSite, portalOrigin } from "./hosts";

export function currentHost(): string | null {
  const request = getRequest();
  if (!request) return null;
  return hostFromHeader(request.headers.get("host") ?? request.headers.get("x-forwarded-host"));
}

export function requestIsPersonal(): boolean {
  return isPersonalSite(currentHost(), process.env);
}

export function requestSite(): { personal: boolean; portalUrl: string | null } {
  const personal = requestIsPersonal();
  return { personal, portalUrl: personal ? portalOrigin(process.env) : null };
}
