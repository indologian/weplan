import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { verifyTurnstileToken } from "@/shared/lib/security/turnstile";

describe("turnstile", () => {
  const origEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...origEnv };
    process.env.TURNSTILE_SECRET_KEY = "test-secret-key";
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it("returns success when token verification succeeds", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });

    const result = await verifyTurnstileToken("valid-token", "127.0.0.1");
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("returns failure when token verification fails", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        success: false,
        "error-codes": ["invalid-input-response"],
      }),
    });

    const result = await verifyTurnstileToken("invalid-token", "127.0.0.1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Turnstile verification failed");
  });

  it("returns success when no secret key configured (graceful skip)", async () => {
    process.env.TURNSTILE_SECRET_KEY = "";
    const result = await verifyTurnstileToken("any-token", "127.0.0.1");
    expect(result.success).toBe(true);
  });

  it("returns failure when token is empty", async () => {
    const result = await verifyTurnstileToken("", "127.0.0.1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Turnstile token is required");
  });

  it("returns failure when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await verifyTurnstileToken("token", "127.0.0.1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("request failed");
  });
});
