import "server-only";

import crypto from "node:crypto";

const HMAC_ALGORITHM = "sha256";

export function createGuestToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashGuestToken(token: string, secret: string): string {
  return crypto.createHmac(HMAC_ALGORITHM, secret).update(token).digest("hex");
}

export function verifyGuestToken(token: string, hash: string, secret: string): boolean {
  const computed = hashGuestToken(token, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

export function createRsvpEditToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashRsvpEditToken(token: string, secret: string): string {
  return crypto.createHmac(HMAC_ALGORITHM, secret).update(token).digest("hex");
}

export function verifyRsvpEditToken(token: string, hash: string, secret: string): boolean {
  const computed = hashRsvpEditToken(token, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}
