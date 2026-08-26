import { describe, expect, it } from "vitest";
import {
  signSensitiveAuthToken,
  verifySensitiveAuthToken,
} from "@/modules/auth/sensitive-auth-token";

const secret = "test-only-sensitive-auth-secret-32-chars";
const payload = {
  user_id: "7e66e3c1-595f-4fe3-940e-1085e717754f",
  auth_context_version: 3,
  issued_at: 1_000,
  expires_at: 1_600,
};

describe("sensitive-auth token", () => {
  it("verifies signature, validity, and canonical payload", async () => {
    const token = await signSensitiveAuthToken(payload, secret);
    await expect(verifySensitiveAuthToken(token, secret, 1_200)).resolves.toEqual(payload);
  });

  it("rejects tampering and expiry", async () => {
    const token = await signSensitiveAuthToken(payload, secret);
    await expect(verifySensitiveAuthToken(`${token}x`, secret, 1_200)).resolves.toBeNull();
    await expect(verifySensitiveAuthToken(token, secret, 1_600)).resolves.toBeNull();
  });

  it("refuses tokens valid for longer than ten minutes", async () => {
    await expect(signSensitiveAuthToken({ ...payload, expires_at: 1_601 }, secret)).rejects.toThrow();
  });
});
