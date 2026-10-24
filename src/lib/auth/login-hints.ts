import { createServerFn } from "@tanstack/react-start";
import { passwordResetConfigured } from "./password-mail";

/** Host of this request plus whether the forgot-password link can be shown. */
export const loadLoginHints = createServerFn({ method: "GET" }).handler(async () => {
  const { requestSite } = await import("@/lib/personal/request.server");
  return { ...requestSite(), passwordReset: passwordResetConfigured(process.env) };
});
