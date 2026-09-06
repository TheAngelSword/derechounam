/**
 * Social providers exposed by Atrio.
 *
 * Production uses Better Auth's native Google provider so the deployment does
 * not depend on the Grok preview OAuth broker.
 */
export type AuthProvider = {
  providerId: "google";
  label: string;
};

export const AUTH_PROVIDERS: readonly AuthProvider[] = [
  { providerId: "google", label: "Google" },
];

// Backwards-compatible alias used by a couple of UI components.
export const GROK_PROVIDERS = AUTH_PROVIDERS;
