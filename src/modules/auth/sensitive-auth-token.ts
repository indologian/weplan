import { z } from "zod";

export const SENSITIVE_AUTH_MAX_AGE_SECONDS = 10 * 60;

const sensitiveAuthPayloadSchema = z.object({
  user_id: z.uuid(),
  auth_context_version: z.number().int().positive(),
  issued_at: z.number().int().nonnegative(),
  expires_at: z.number().int().positive(),
}).strict();

export type SensitiveAuthPayload = z.infer<typeof sensitiveAuthPayloadSchema>;

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function decodeBase64Url(value: string): Uint8Array | null {
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSensitiveAuthToken(
  payload: SensitiveAuthPayload,
  secret: string,
): Promise<string> {
  const parsed = sensitiveAuthPayloadSchema.parse(payload);
  if (parsed.expires_at <= parsed.issued_at
    || parsed.expires_at - parsed.issued_at > SENSITIVE_AUTH_MAX_AGE_SECONDS) {
    throw new Error("Sensitive-auth validity must be at most ten minutes");
  }

  const payloadPart = encodeBase64Url(new TextEncoder().encode(JSON.stringify(parsed)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await importHmacKey(secret),
    new TextEncoder().encode(payloadPart),
  );
  return `${payloadPart}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifySensitiveAuthToken(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<SensitiveAuthPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const payloadBytes = decodeBase64Url(parts[0]);
  const signature = decodeBase64Url(parts[1]);
  if (!payloadBytes || !signature) return null;

  const signatureIsValid = await crypto.subtle.verify(
    "HMAC",
    await importHmacKey(secret),
    new Uint8Array(signature).buffer,
    new TextEncoder().encode(parts[0]),
  );
  if (!signatureIsValid) return null;

  try {
    const payload = sensitiveAuthPayloadSchema.parse(JSON.parse(new TextDecoder().decode(payloadBytes)));
    if (payload.expires_at <= payload.issued_at) return null;
    if (payload.expires_at - payload.issued_at > SENSITIVE_AUTH_MAX_AGE_SECONDS) return null;
    if (payload.issued_at > nowSeconds || payload.expires_at <= nowSeconds) return null;
    return payload;
  } catch {
    return null;
  }
}
