import { useState, type FormEvent } from "react";
import { getBearerToken } from "@/lib/auth/client";
import { Button, Field, Input } from "@/components/ui";

async function postAuth(path: string, body: Record<string, unknown>): Promise<{ ok: boolean; message: string }> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const token = getBearerToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(path, { method: "POST", credentials: "include", headers, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => null) as { message?: string; code?: string } | null;
  const message = payload?.message ?? "";
  return { ok: response.ok, message };
}

function changeError(message: string): string {
  if (/invalid password|incorrect password|password is incorrect/i.test(message)) return "La contraseña actual no coincide.";
  if (/too short|password/i.test(message)) return "La clave nueva debe tener al menos 8 caracteres.";
  return "No se pudo cambiar la contraseña. Revisa la clave actual e inténtalo de nuevo.";
}

/** Signed-in password change. Works on the portal and on the personal space. */
export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const again = String(form.get("confirmPassword") ?? "");
    if (newPassword.length < 8) {
      setError("La clave nueva debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== again) {
      setError("Las claves nuevas no coinciden.");
      return;
    }
    setPending(true);
    try {
      const result = await postAuth("/api/auth/change-password", { currentPassword, newPassword, revokeOtherSessions: true });
      if (!result.ok) {
        setError(changeError(result.message));
        return;
      }
      event.currentTarget.reset();
      setNotice("Contraseña actualizada. Las otras sesiones de este sitio se cerraron.");
    } catch {
      setError("No se pudo cambiar la contraseña. Revisa la conexión e inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Field label="Contraseña actual"><Input name="currentPassword" type="password" required autoComplete="current-password" minLength={8} /></Field>
      <Field label="Contraseña nueva"><Input name="newPassword" type="password" required autoComplete="new-password" minLength={8} /></Field>
      <Field label="Repite la contraseña nueva"><Input name="confirmPassword" type="password" required autoComplete="new-password" minLength={8} /></Field>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      {notice ? <p role="status" className="text-sm text-forest">{notice}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Cambiar contraseña"}</Button>
    </form>
  );
}
