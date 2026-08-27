import { describe, expect, it, vi } from "vitest";

vi.mock("@upstash/redis", () => ({
  Redis: class MockRedis {
    constructor() {}
  },
}));

vi.mock("@upstash/ratelimit", () => {
  const fn = vi.fn().mockImplementation(() => ({
    limit: vi.fn().mockResolvedValue({
      success: true,
      remaining: 10,
      reset: Date.now() + 600000,
    }),
  }));
  (fn as unknown as Record<string, unknown>).slidingWindow = vi.fn().mockReturnValue({});
  return { Ratelimit: fn };
});

vi.mock("@/shared/lib/env/server", () => ({
  getRedisEnv: () => ({ REDIS_URL: "redis://localhost:6379", REDIS_TOKEN: "test-token" }),
}));

import { pseudonymizeIp, extractIpFromHeaders } from "@/shared/lib/rate-limit/index";

describe("rate-limit utilities", () => {
  describe("pseudonymizeIp", () => {
    it("returns 'unknown' for empty string", () => {
      expect(pseudonymizeIp("")).toBe("unknown");
    });

    it("returns consistent 64-char hex hash for same IP", () => {
      const hash1 = pseudonymizeIp("192.168.1.1");
      const hash2 = pseudonymizeIp("192.168.1.1");
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(hash1)).toBe(true);
    });

    it("returns different hash for different IPs", () => {
      const hash1 = pseudonymizeIp("192.168.1.1");
      const hash2 = pseudonymizeIp("10.0.0.1");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("extractIpFromHeaders", () => {
    it("extracts first IP from x-forwarded-for", () => {
      const headers = new Headers();
      headers.set("x-forwarded-for", "1.2.3.4, 5.6.7.8");
      expect(extractIpFromHeaders(headers)).toBe("1.2.3.4");
    });

    it("extracts from x-real-ip", () => {
      const headers = new Headers();
      headers.set("x-real-ip", "1.2.3.4");
      expect(extractIpFromHeaders(headers)).toBe("1.2.3.4");
    });

    it("returns 'unknown' when no IP headers present", () => {
      const headers = new Headers();
      expect(extractIpFromHeaders(headers)).toBe("unknown");
    });
  });
});
