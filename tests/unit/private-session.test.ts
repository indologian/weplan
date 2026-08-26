import { describe, expect, it } from "vitest";

const TEST_SECRET = "test-secret-key-for-private-session-hmac-32ch!";

// Inline the functions to avoid server-only import in test environment
import crypto from "node:crypto";

const SESSION_MAX_AGE_SECONDS = 6 * 60 * 60;

type PrivateSessionPayload = {
  invitation_id: string;
  pin_version: number;
  issued_at: number;
  expires_at: number;
  key_version: number;
};

function signPrivateSession(
  payload: { invitation_id: string; pin_version: number; issued_at: number; key_version?: number },
  secret: string,
  defaultKeyVersion: number = 1,
): string {
  const fullPayload: PrivateSessionPayload = {
    invitation_id: payload.invitation_id,
    pin_version: payload.pin_version,
    issued_at: payload.issued_at,
    expires_at: payload.issued_at + SESSION_MAX_AGE_SECONDS,
    key_version: payload.key_version ?? defaultKeyVersion,
  };
  const data = JSON.stringify(fullPayload);
  const dataBase64 = Buffer.from(data).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(dataBase64).digest("hex");
  return dataBase64 + "." + signature;
}

function verifyPrivateSession(
  token: string,
  secret: string,
  currentPinVersion: number,
  nowSeconds: number,
): { valid: boolean; payload?: PrivateSessionPayload } {
  const [dataPart, signaturePart] = token.split(".");
  if (!dataPart || !signaturePart) return { valid: false };
  const expectedSig = crypto.createHmac("sha256", secret).update(dataPart).digest("hex");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(signaturePart, "hex"), Buffer.from(expectedSig, "hex"))) {
      return { valid: false };
    }
  } catch {
    return { valid: false };
  }
  const payload: PrivateSessionPayload = JSON.parse(Buffer.from(dataPart, "base64url").toString());
  if (payload.expires_at <= nowSeconds) return { valid: false };
  if (payload.pin_version !== currentPinVersion) return { valid: false };
  return { valid: true, payload };
}

describe("private session", () => {
  it("signs and verifies a valid session", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signPrivateSession(
      { invitation_id: "test-id", pin_version: 1, issued_at: now },
      TEST_SECRET,
    );

    const result = verifyPrivateSession(token, TEST_SECRET, 1, now + 60);
    expect(result.valid).toBe(true);
    expect(result.payload?.invitation_id).toBe("test-id");
  });

  it("rejects expired session", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signPrivateSession(
      { invitation_id: "test-id", pin_version: 1, issued_at: now - 7 * 60 * 60 },
      TEST_SECRET,
    );

    const result = verifyPrivateSession(token, TEST_SECRET, 1, now);
    expect(result.valid).toBe(false);
  });

  it("rejects session with wrong pin_version", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signPrivateSession(
      { invitation_id: "test-id", pin_version: 1, issued_at: now },
      TEST_SECRET,
    );

    const result = verifyPrivateSession(token, TEST_SECRET, 2, now + 60);
    expect(result.valid).toBe(false);
  });

  it("rejects tampered token", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signPrivateSession(
      { invitation_id: "test-id", pin_version: 1, issued_at: now },
      TEST_SECRET,
    );

    const tampered = token.slice(0, -10) + "tampered12";
    const result = verifyPrivateSession(tampered, TEST_SECRET, 1, now + 60);
    expect(result.valid).toBe(false);
  });

  it("rejects token signed with wrong secret", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signPrivateSession(
      { invitation_id: "test-id", pin_version: 1, issued_at: now },
      "wrong-secret-key-for-hmac-signing-32chars!!",
    );

    const result = verifyPrivateSession(token, TEST_SECRET, 1, now + 60);
    expect(result.valid).toBe(false);
  });

  it("rejects malformed token", () => {
    expect(verifyPrivateSession("not-a-valid-token", TEST_SECRET, 1, Date.now() / 1000).valid).toBe(false);
    expect(verifyPrivateSession("", TEST_SECRET, 1, Date.now() / 1000).valid).toBe(false);
  });
});
