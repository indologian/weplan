import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/shared/lib/supabase/service-client", () => ({
  createSupabaseServiceClient: () => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: "mock-uuid" }, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

import { enqueueEmailOutbox, enqueuePaymentReceiptEmail, enqueuePaymentExpiredEmail } from "@/modules/jobs/server/enqueue";

describe("enqueue helpers", () => {
  it("enqueueEmailOutbox returns event id", async () => {
    const id = await enqueueEmailOutbox({
      to: "test@example.com",
      template: "payment_receipt",
      data: { invitationSlug: "test-slug" },
    });
    expect(id).toBe("mock-uuid");
  });

  it("enqueuePaymentReceiptEmail returns event id", async () => {
    const id = await enqueuePaymentReceiptEmail("test@example.com", "test-slug", "premium", "6 months");
    expect(id).toBe("mock-uuid");
  });

  it("enqueuePaymentExpiredEmail returns event id", async () => {
    const id = await enqueuePaymentExpiredEmail("test@example.com", "test-slug");
    expect(id).toBe("mock-uuid");
  });
});
