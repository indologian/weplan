import { describe, expect, it } from "vitest";
import crypto from "node:crypto";

const CURRENT_SECRET = "current-session-secret-key-32chars!!";
const PREVIOUS_SECRET = "previous-session-secret-key-32ch!!";

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

function verifyWithKeyRotation(
  token: string,
  currentSecret: string,
  previousSecret: string | null,
  currentPinVersion: number,
  nowSeconds: number,
): { valid: boolean; payload?: PrivateSessionPayload } {
  const [dataPart, signaturePart] = token.split(".");
  if (!dataPart || !signaturePart) return { valid: false };

  let matchedSecret: string | null = null;

  const currentSig = crypto.createHmac("sha256", currentSecret).update(dataPart).digest("hex");
  try {
    if (crypto.timingSafeEqual(Buffer.from(signaturePart, "hex"), Buffer.from(currentSig, "hex"))) {
      matchedSecret = currentSecret;
    }
  } catch { /* invalid hex */ }

  if (!matchedSecret && previousSecret) {
    const prevSig = crypto.createHmac("sha256", previousSecret).update(dataPart).digest("hex");
    try {
      if (crypto.timingSafeEqual(Buffer.from(signaturePart, "hex"), Buffer.from(prevSig, "hex"))) {
        matchedSecret = previousSecret;
      }
    } catch { /* invalid hex */ }
  }

  if (!matchedSecret) return { valid: false };

  const payload: PrivateSessionPayload = JSON.parse(Buffer.from(dataPart, "base64url").toString());
  if (payload.expires_at <= nowSeconds) return { valid: false };
  if (payload.pin_version !== currentPinVersion) return { valid: false };

  return { valid: true, payload };
}

describe("private session key rotation", () => {
  it("valid session with current key", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signPrivateSession(
      { invitation_id: "inv-1", pin_version: 1, issued_at: now },
      CURRENT_SECRET,
    );
    const result = verifyWithKeyRotation(token, CURRENT_SECRET, null, 1, now + 60);
    expect(result.valid).toBe(true);
    expect(result.payload?.key_version).toBe(1);
  });

  it("session signed with previous key still valid during rotation window", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signPrivateSession(
      { invitation_id: "inv-1", pin_version: 1, issued_at: now },
      PREVIOUS_SECRET,
      1,
    );
    const result = verifyWithKeyRotation(token, CURRENT_SECRET, PREVIOUS_SECRET, 1, now + 60);
    expect(result.valid).toBe(true);
  });

  it("session signed with previous key rejected after emergency rotation (no previous key)", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signPrivateSession(
      { invitation_id: "inv-1", pin_version: 1, issued_at: now },
      PREVIOUS_SECRET,
      1,
    );
    const result = verifyWithKeyRotation(token, CURRENT_SECRET, null, 1, now + 60);
    expect(result.valid).toBe(false);
  });

  it("session signed with random key rejected", () => {
    const now = Math.floor(Date.now() / 1000);
    const randomSecret = "completely-different-secret-key-32ch";
    const token = signPrivateSession(
      { invitation_id: "inv-1", pin_version: 1, issued_at: now },
      randomSecret,
    );
    const result = verifyWithKeyRotation(token, CURRENT_SECRET, PREVIOUS_SECRET, 1, now + 60);
    expect(result.valid).toBe(false);
  });

  it("session rejected when pin_version changes (revoke via PIN rotation)", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signPrivateSession(
      { invitation_id: "inv-1", pin_version: 1, issued_at: now },
      CURRENT_SECRET,
    );
    const result = verifyWithKeyRotation(token, CURRENT_SECRET, null, 2, now + 60);
    expect(result.valid).toBe(false);
  });

  it("session rejected after expiry", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signPrivateSession(
      { invitation_id: "inv-1", pin_version: 1, issued_at: now - SESSION_MAX_AGE_SECONDS - 100 },
      CURRENT_SECRET,
    );
    const result = verifyWithKeyRotation(token, CURRENT_SECRET, null, 1, now);
    expect(result.valid).toBe(false);
  });

  it("tampered token rejected", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signPrivateSession(
      { invitation_id: "inv-1", pin_version: 1, issued_at: now },
      CURRENT_SECRET,
    );
    const tampered = token.slice(0, -10) + "tampered12";
    const result = verifyWithKeyRotation(tampered, CURRENT_SECRET, null, 1, now + 60);
    expect(result.valid).toBe(false);
  });

  it("double key rotation: current then rotated again rejects old tokens", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signPrivateSession(
      { invitation_id: "inv-1", pin_version: 1, issued_at: now },
      PREVIOUS_SECRET,
    );

    let result = verifyWithKeyRotation(token, CURRENT_SECRET, PREVIOUS_SECRET, 1, now + 60);
    expect(result.valid).toBe(true);

    const newPreviousSecret = CURRENT_SECRET;
    const newCurrentSecret = "brand-new-secret-key-after-second-rotation";
    result = verifyWithKeyRotation(token, newCurrentSecret, newPreviousSecret, 1, now + 60);
    expect(result.valid).toBe(false);
  });
});
