import { timingSafeEqual } from "node:crypto";

/** Constant-time compare. A missing or short secret never matches. */
export function secretMatches(provided: string | null | undefined, secret: string | undefined, minLength = 24): boolean {
  const expected = secret ?? "";
  const given = provided ?? "";
  const expectedBuf = Buffer.from(expected);
  const givenBuf = Buffer.from(given);
  if (expected.length < minLength) {
    timingSafeEqual(Buffer.alloc(32, 1), Buffer.alloc(32, 2));
    return false;
  }
  if (expectedBuf.length !== givenBuf.length) {
    timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }
  return timingSafeEqual(expectedBuf, givenBuf);
}

export function bearerMatches(header: string | null | undefined, secret: string | undefined): boolean {
  const value = header?.trim() ?? "";
  const token = value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : "";
  return secretMatches(token, secret, 16);
}
