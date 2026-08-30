vi.mock("server-only", () => ({}));

import { describe, expect, it, vi } from "vitest";
import { createCheckout } from "@/modules/payment/server/actions";
import { evaluatePublishReadiness } from "@/modules/invitation/server/publish-readiness-evaluator";

vi.mock("@/modules/invitation/server/publish-readiness-evaluator", () => ({
  evaluatePublishReadiness: vi.fn(),
}));
vi.mock("@/shared/lib/supabase/service-client", () => ({
  createSupabaseServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { status: "draft", entitlement_tier_id: null } }) })) })) })) }))
  })),
}));

describe("createCheckout", () => {
  it("throws INVITATION_NOT_READY before anything else if not ready", async () => {
    vi.mocked(evaluatePublishReadiness).mockResolvedValueOnce({
      isReady: false,
      issues: [{ code: "GROOM_NAME_REQUIRED", path: "groomName", message: "Missing" }],
      
      
    });
    
    await expect(createCheckout("user1", "inv1", "req1")).rejects.toThrowError("Invitation is not ready to publish");
  });
});

