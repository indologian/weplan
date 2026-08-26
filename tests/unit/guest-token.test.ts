import { describe, expect, it } from "vitest";
import crypto from "node:crypto";

const TEST_SECRET = "test-secret-key-for-guest-token-hmac-32chars!";

function createGuestToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashGuestToken(token: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

function verifyGuestToken(token: string, hash: string, secret: string): boolean {
  const computed = hashGuestToken(token, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

function createRsvpEditToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashRsvpEditToken(token: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

function verifyRsvpEditToken(token: string, hash: string, secret: string): boolean {
  const computed = hashRsvpEditToken(token, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

describe("guest token", () => {
  it("creates a 64-character hex token", () => {
    const token = createGuestToken();
    expect(token).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it("hash and verify round-trips", () => {
    const token = createGuestToken();
    const hash = hashGuestToken(token, TEST_SECRET);
    expect(verifyGuestToken(token, hash, TEST_SECRET)).toBe(true);
  });

  it("rejects wrong token", () => {
    const token = createGuestToken();
    const hash = hashGuestToken(token, TEST_SECRET);
    const wrongToken = createGuestToken();
    expect(verifyGuestToken(wrongToken, hash, TEST_SECRET)).toBe(false);
  });

  it("rejects wrong secret", () => {
    const token = createGuestToken();
    const hash = hashGuestToken(token, TEST_SECRET);
    expect(verifyGuestToken(token, hash, "wrong-secret")).toBe(false);
  });

  it("produces consistent hashes", () => {
    const token = "same-token-value";
    const hash1 = hashGuestToken(token, TEST_SECRET);
    const hash2 = hashGuestToken(token, TEST_SECRET);
    expect(hash1).toBe(hash2);
  });
});

describe("rsvp edit token", () => {
  it("creates a 64-character hex token", () => {
    const token = createRsvpEditToken();
    expect(token).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it("hash and verify round-trips", () => {
    const token = createRsvpEditToken();
    const hash = hashRsvpEditToken(token, TEST_SECRET);
    expect(verifyRsvpEditToken(token, hash, TEST_SECRET)).toBe(true);
  });

  it("rejects wrong token", () => {
    const token = createRsvpEditToken();
    const hash = hashRsvpEditToken(token, TEST_SECRET);
    const wrongToken = createRsvpEditToken();
    expect(verifyRsvpEditToken(wrongToken, hash, TEST_SECRET)).toBe(false);
  });
});
