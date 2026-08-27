import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@upstash/redis", () => ({
  Redis: class MockRedis {
    private store = new Map<string, { value: unknown; expiresAt?: number }>();
    async get<T = unknown>(key: string): Promise<T | null> {
      const entry = this.store.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.store.delete(key);
        return null;
      }
      return entry.value as T;
    }
    async set(key: string, value: unknown, opts?: { ex?: number }): Promise<void> {
      this.store.set(key, {
        value,
        expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : undefined,
      });
    }
    async incr(key: string): Promise<number> {
      const existing = this.store.get(key);
      const val = ((existing?.value as number) ?? 0) + 1;
      this.store.set(key, { value: val, expiresAt: existing?.expiresAt });
      return val;
    }
    async del(...keys: string[]): Promise<void> {
      keys.forEach((k) => this.store.delete(k));
    }
    async ttl(): Promise<number> {
      return 900;
    }
    async expire(key: string, seconds: number): Promise<void> {
      const existing = this.store.get(key);
      if (existing) {
        existing.expiresAt = Date.now() + seconds * 1000;
      }
    }
    pipeline() {
      const ops: Array<{ fn: string; args: unknown[] }> = [];
      const storeRef = this.store;
      return {
        incr(key: string) { ops.push({ fn: "incr", args: [key] }); return this; },
        expire(key: string, seconds: number) { ops.push({ fn: "expire", args: [key, seconds] }); return this; },
        sadd(key: string, ...members: string[]) { ops.push({ fn: "sadd", args: [key, ...members] }); return this; },
        async exec(): Promise<unknown[]> {
          const results: unknown[] = [];
          for (const op of ops) {
            if (op.fn === "incr") {
              const key = op.args[0] as string;
              const entry = storeRef.get(key);
              const val = ((entry?.value as number) ?? 0) + 1;
              storeRef.set(key, { value: val, expiresAt: entry?.expiresAt });
              results.push(val);
            } else if (op.fn === "expire") {
              const entry = storeRef.get(op.args[0] as string);
              if (entry) entry.expiresAt = Date.now() + (op.args[1] as number) * 1000;
              results.push(1);
            } else if (op.fn === "sadd") {
              results.push(1);
            } else {
              results.push(0);
            }
          }
          return results;
        },
      };
    }
    async scard(): Promise<number> { return 1; }
  },
}));

vi.mock("@/shared/lib/env/server", () => ({
  getRedisEnv: () => ({ REDIS_URL: "redis://localhost:6379", REDIS_TOKEN: "test-token" }),
}));

vi.mock("server-only", () => ({}));

import { recordPinFailure, checkPinDefense, clearPinBlockOnSuccess, incrementHeightenedAttempt } from "@/shared/lib/security/pin-defense";

describe("pin-defense", () => {
  const INVITE_ID = "test-invite-uuid";
  const IP = "192.168.1.1";

  describe("recordPinFailure", () => {
    it("returns normal level for first few failures", async () => {
      const result = await recordPinFailure(INVITE_ID, IP);
      expect(result.level).toBe("normal");
    });

    it("escalates to turnstile_required at 5 failures", async () => {
      for (let i = 0; i < 5; i++) {
        await recordPinFailure(INVITE_ID, IP);
      }
      const result = await recordPinFailure(INVITE_ID, IP);
      expect(["turnstile_required", "blocked_15m"]).toContain(result.level);
    });

    it("escalates to blocked_15m at 10 failures", async () => {
      for (let i = 0; i < 10; i++) {
        await recordPinFailure(INVITE_ID, IP);
      }
      const result = await recordPinFailure(INVITE_ID, IP);
      expect(["blocked_15m", "blocked_1h"]).toContain(result.level);
    });
  });

  describe("checkPinDefense", () => {
    it("returns normal for no failures", async () => {
      const result = await checkPinDefense("fresh-invite", "10.0.0.1");
      expect(result.allowed).toBe(true);
      expect(result.level).toBe("normal");
      expect(result.requiresTurnstile).toBe(false);
    });
  });

  describe("clearPinBlockOnSuccess", () => {
    it("clears block without error", async () => {
      await clearPinBlockOnSuccess(INVITE_ID, IP);
    });
  });

  describe("incrementHeightenedAttempt", () => {
    it("allows attempts under limit", async () => {
      const result = await incrementHeightenedAttempt("heightened-invite", "10.0.0.5");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });
  });
});
