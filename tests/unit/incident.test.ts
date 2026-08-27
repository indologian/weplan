import { describe, expect, it, vi } from "vitest";

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
    async del(...keys: string[]): Promise<void> {
      keys.forEach((k) => this.store.delete(k));
    }
  },
}));

vi.mock("@/shared/lib/env/server", () => ({
  getRedisEnv: () => ({ REDIS_URL: "redis://localhost:6379", REDIS_TOKEN: "test-token" }),
}));

vi.mock("server-only", () => ({}));

import { createOrUpdateIncident, checkIncidentStatus, isIncidentActive } from "@/shared/lib/security/incident";

describe("incident lifecycle", () => {
  const INVITE_ID = "test-incident-invite";

  describe("createOrUpdateIncident", () => {
    it("creates new incident and sends alert", async () => {
      const result = await createOrUpdateIncident(INVITE_ID);
      expect(result.isNew).toBe(true);
      expect(result.shouldSendAlert).toBe(true);
    });

    it("updates existing incident without sending alert", async () => {
      await createOrUpdateIncident(INVITE_ID);
      const result = await createOrUpdateIncident(INVITE_ID);
      expect(result.isNew).toBe(false);
      expect(result.shouldSendAlert).toBe(false);
    });
  });

  describe("checkIncidentStatus", () => {
    it("returns null when no incident exists", async () => {
      const result = await checkIncidentStatus("no-incident-invite");
      expect(result).toBeNull();
    });

    it("reports active incident", async () => {
      const inviteId = "active-incident-invite";
      await createOrUpdateIncident(inviteId);
      const result = await checkIncidentStatus(inviteId);
      expect(result?.active).toBe(true);
      expect(result?.shouldClose).toBe(false);
    });
  });

  describe("isIncidentActive", () => {
    it("returns false when no incident", async () => {
      expect(await isIncidentActive("no-incident")).toBe(false);
    });

    it("returns true when incident exists", async () => {
      const inviteId = "check-active-invite";
      await createOrUpdateIncident(inviteId);
      expect(await isIncidentActive(inviteId)).toBe(true);
    });
  });
});
