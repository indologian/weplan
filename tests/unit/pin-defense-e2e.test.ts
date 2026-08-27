import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@upstash/redis", () => ({
  Redis: class MockRedis {
    private store = new Map<string, { value: unknown; expiresAt?: number }>();
    async get<T = unknown>(key: string): Promise<T | null> {
      const entry = this.store.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) { this.store.delete(key); return null; }
      return entry.value as T;
    }
    async set(key: string, value: unknown, opts?: { ex?: number }): Promise<void> {
      this.store.set(key, { value, expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : undefined });
    }
    async incr(key: string): Promise<number> {
      const entry = this.store.get(key);
      const val = ((entry?.value as number) ?? 0) + 1;
      this.store.set(key, { value: val, expiresAt: entry?.expiresAt });
      return val;
    }
    async del(...keys: string[]): Promise<void> { keys.forEach((k) => this.store.delete(k)); }
    async expire(key: string, seconds: number): Promise<void> {
      const entry = this.store.get(key);
      if (entry) entry.expiresAt = Date.now() + seconds * 1000;
    }
    async ttl(): Promise<number> { return 900; }
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
              const e = storeRef.get(key);
              const val = ((e?.value as number) ?? 0) + 1;
              storeRef.set(key, { value: val, expiresAt: e?.expiresAt });
              results.push(val);
            } else if (op.fn === "expire") {
              const e = storeRef.get(op.args[0] as string);
              if (e) e.expiresAt = Date.now() + (op.args[1] as number) * 1000;
              results.push(1);
            } else if (op.fn === "sadd") { results.push(1); }
            else results.push(0);
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

import { recordPinFailure, checkPinDefense, clearPinBlockOnSuccess } from "@/shared/lib/security/pin-defense";

describe("pin-defense end-to-end escalating blocks", () => {
  const INVITE = "e2e-invite-uuid";
  const IP = "192.168.1.100";

  beforeEach(async () => {
    await clearPinBlockOnSuccess(INVITE, IP);
  });

  it("0 failures → normal, no turnstile", async () => {
    const result = await checkPinDefense(INVITE, IP);
    expect(result.allowed).toBe(true);
    expect(result.level).toBe("normal");
    expect(result.requiresTurnstile).toBe(false);
  });

  it("5+ failures → turnstile required", async () => {
    for (let i = 0; i < 5; i++) {
      await recordPinFailure(INVITE, IP);
    }
    const result = await checkPinDefense(INVITE, IP);
    expect(result.requiresTurnstile).toBe(true);
    expect(["turnstile_required", "blocked_15m"]).toContain(result.level);
  });

  it("10+ failures → blocked_15m", async () => {
    for (let i = 0; i < 10; i++) {
      await recordPinFailure(INVITE, IP);
    }
    const result = await checkPinDefense(INVITE, IP);
    expect(["blocked_15m", "blocked_1h"]).toContain(result.level);
  });

  it("success clears block but risk counter persists", async () => {
    for (let i = 0; i < 6; i++) {
      await recordPinFailure(INVITE, IP);
    }
    const before = await checkPinDefense(INVITE, IP);
    expect(before.requiresTurnstile).toBe(true);

    await clearPinBlockOnSuccess(INVITE, IP);

    const after = await checkPinDefense(INVITE, IP);
    expect(after.requiresTurnstile).toBe(true);
    expect(["turnstile_required", "blocked_15m"]).toContain(after.level);
  });
});
