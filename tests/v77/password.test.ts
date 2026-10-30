import test from "node:test";
import assert from "node:assert/strict";
import { authBlockReason, deployedWithoutDatabase, productionSecretReady } from "../../src/lib/auth/database-guard.ts";
import { passwordResetConfigured, personalResetAllowed, RESET_PUBLIC_MESSAGE, sendResetEmail } from "../../src/lib/auth/password-mail.ts";

const secret = "x".repeat(32);

test("en Vercel sin DATABASE_URL no hay PGLite; en local sí", () => {
  assert.equal(deployedWithoutDatabase({ VERCEL_ENV: "preview" }), true);
  assert.equal(deployedWithoutDatabase({ VERCEL_ENV: "production", DATABASE_URL: "  " }), true);
  assert.equal(deployedWithoutDatabase({ VERCEL_ENV: "preview", DATABASE_URL: "postgres://db" }), false);
  assert.equal(deployedWithoutDatabase({ VERCEL_ENV: "development" }), false);
  assert.equal(deployedWithoutDatabase({}), false);
  assert.equal(productionSecretReady({ VERCEL_ENV: "production", BETTER_AUTH_SECRET: "corto" }), false);
  assert.equal(productionSecretReady({ VERCEL_ENV: "preview" }), true);
  assert.equal(authBlockReason({ VERCEL_ENV: "production", BETTER_AUTH_SECRET: "", DATABASE_URL: "" }), "secret");
  assert.equal(authBlockReason({ VERCEL_ENV: "preview", BETTER_AUTH_SECRET: secret }), "database");
  assert.equal(authBlockReason({ VERCEL_ENV: "production", BETTER_AUTH_SECRET: secret, DATABASE_URL: "postgres://db" }), null);
  assert.equal(authBlockReason({ BETTER_AUTH_SECRET: secret }), null);
});

test("el correo de recuperación solo sale con Resend y, en pnota, solo al titular", () => {
  assert.equal(passwordResetConfigured({}), false);
  assert.equal(passwordResetConfigured({ RESEND_API_KEY: "re_test", EMAIL_FROM: "" }), false);
  assert.equal(passwordResetConfigured({ RESEND_API_KEY: "re_test", EMAIL_FROM: "avisos@pnota.com" }), true);
  const env = { PERSONAL_OWNER_EMAILS: "Angel@unam.mx" };
  assert.equal(personalResetAllowed("otro@unam.mx", env, false), true);
  assert.equal(personalResetAllowed("angel@unam.mx", env, true), true);
  assert.equal(personalResetAllowed("otro@unam.mx", env, true), false);
  assert.equal(personalResetAllowed("otro@unam.mx", { PERSONAL_OWNER_EMAILS: "" }, true), false);
  assert.equal(RESET_PUBLIC_MESSAGE.includes("revisa tu bandeja"), true);
});

test("Resend no filtra la clave ni el enlace cuando falla", async () => {
  const key = "re_super_secret_key_value";
  const link = "https://pnota.com/api/auth/reset-password/token-secreto";
  let auth = "";
  await assert.rejects(
    () => sendResetEmail(
      { RESEND_API_KEY: key, EMAIL_FROM: "avisos@pnota.com" },
      { to: "angel@unam.mx", url: link },
      async (_url, init) => {
        auth = new Headers(init?.headers).get("Authorization") ?? "";
        return new Response("no", { status: 422 });
      },
    ),
    (error: unknown) => {
      const message = error instanceof Error ? error.message : "";
      assert.equal(message, "Resend respondió 422.");
      assert.equal(message.includes(key), false);
      assert.equal(message.includes("token-secreto"), false);
      return true;
    },
  );
  assert.equal(auth, `Bearer ${key}`);
});
