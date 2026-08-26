import "server-only";

import crypto from "node:crypto";

const SESSION_MAX_AGE_SECONDS = 6 * 60 * 60; // 6 hours

type PrivateSessionPayload = {
  invitation_id: string;
  pin_version: number;
  issued_at: number;
  expires_at: number;
  key_version: number;
};

export function signPrivateSession(
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

export function verifyPrivateSession(
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
