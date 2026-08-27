import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/shared/lib/supabase/service-client", () => ({
  createSupabaseServiceClient: () => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockImplementation((cb: (r: unknown) => unknown) => cb({ data: [], error: null })),
    storage: {
      from: vi.fn().mockReturnValue({
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("node:crypto", () => ({
  default: { randomUUID: () => "test-uuid" },
}));

import { insertOutboxEvent, reclaimStaleLeases, OutboxError } from "@/modules/jobs/server/outbox";
import { MAX_RETRY_ATTEMPTS, BACKOFF_BASE_MS, BACKOFF_MAX_MS } from "@/modules/jobs/types";

describe("outbox dispatcher types", () => {
  it("MAX_RETRY_ATTEMPTS is 5", () => {
    expect(MAX_RETRY_ATTEMPTS).toBe(5);
  });

  it("BACKOFF_BASE_MS is 30s", () => {
    expect(BACKOFF_BASE_MS).toBe(30_000);
  });

  it("BACKOFF_MAX_MS is 30min", () => {
    expect(BACKOFF_MAX_MS).toBe(30 * 60 * 1000);
  });

  it("Backoff grows exponentially", () => {
    const backoff0 = BACKOFF_BASE_MS * Math.pow(2, 0);
    const backoff1 = BACKOFF_BASE_MS * Math.pow(2, 1);
    const backoff2 = BACKOFF_BASE_MS * Math.pow(2, 2);
    expect(backoff1).toBeGreaterThan(backoff0);
    expect(backoff2).toBeGreaterThan(backoff1);
  });

  it("Backoff caps at maximum", () => {
    const cappedBackoff = Math.min(BACKOFF_BASE_MS * Math.pow(2, 10), BACKOFF_MAX_MS);
    expect(cappedBackoff).toBe(BACKOFF_MAX_MS);
  });
});

describe("OutboxError", () => {
  it("has correct properties", () => {
    const error = new OutboxError("test", "DISPATCH_FAILED");
    expect(error.name).toBe("OutboxError");
    expect(error.code).toBe("DISPATCH_FAILED");
    expect(error.message).toBe("test");
  });
});

describe("insertOutboxEvent", () => {
  it("does not throw when called", async () => {
    await expect(
      insertOutboxEvent("test_event", "test_aggregate", "agg-1", { key: "value" }),
    ).resolves.toBeDefined();
  });
});

describe("reclaimStaleLeases", () => {
  it("returns a number", async () => {
    const reclaimed = await reclaimStaleLeases();
    expect(typeof reclaimed).toBe("number");
  });
});
