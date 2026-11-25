export function signToken(secret: string, payload: Record<string, unknown>): string;
export function verifyToken(secret: string, token: string, type: string, now?: number): Record<string, unknown> | null;
export const UUID: RegExp;
