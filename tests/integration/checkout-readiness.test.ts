vi.mock("server-only", () => ({}));

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCheckout, PaymentError } from "@/modules/payment/server/actions";
import { evaluatePublishReadiness } from "@/modules/invitation/server/publish-readiness-evaluator";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  invitationMaybeSingle: vi.fn(),
  activeCheckoutMaybeSingle: vi.fn(),
  transactionInsert: vi.fn(),
  paymentAttemptInsert: vi.fn(),
  createSnapTransaction: vi.fn(),
}));

vi.mock("@/modules/invitation/server/publish-readiness-evaluator", () => ({
  evaluatePublishReadiness: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/service-client", () => ({
  createSupabaseServiceClient: vi.fn(() => ({ from: mocks.from })),
}));

vi.mock("@/modules/payment/provider/midtrans/client", () => ({
  createSnapTransaction: mocks.createSnapTransaction,
  getTransactionStatus: vi.fn(),
  cancelMidtransTransaction: vi.fn(),
}));

function queryEndingWith(maybeSingle: ReturnType<typeof vi.fn>) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle,
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  return query;
}

describe("createCheckout readiness gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(evaluatePublishReadiness).mockResolvedValue({
      isReady: false,
      issues: [{ code: "GROOM_NAME_REQUIRED", path: "groomName", message: "Missing" }],
    });
    mocks.invitationMaybeSingle.mockResolvedValue({
      data: {
        id: "inv1",
        user_id: "user1",
        status: "draft",
        theme_id: "theme1",
        entitlement_tier_id: null,
      },
      error: null,
    });
    mocks.activeCheckoutMaybeSingle.mockResolvedValue({
      data: {
        id: "active-transaction",
        payment_state: "awaiting_payment",
        amount_idr: 149000,
      },
      error: null,
    });

    mocks.from.mockImplementation((table: string) => {
      if (table === "invitations") {
        return queryEndingWith(mocks.invitationMaybeSingle);
      }
      if (table === "transactions") {
        return {
          ...queryEndingWith(mocks.activeCheckoutMaybeSingle),
          insert: mocks.transactionInsert,
        };
      }
      if (table === "payment_attempts") {
        return {
          ...queryEndingWith(vi.fn()),
          insert: mocks.paymentAttemptInsert,
        };
      }
      return queryEndingWith(vi.fn());
    });
  });

  async function expectReadinessRejection() {
    const checkout = createCheckout("user1", "inv1", "req1");

    await expect(checkout).rejects.toBeInstanceOf(PaymentError);
    await expect(checkout).rejects.toMatchObject({
      code: "INVITATION_NOT_READY",
      message: expect.stringContaining("not ready to publish"),
    });
  }

  it("rejects before transaction or provider side effects", async () => {
    await expectReadinessRejection();

    expect(mocks.from).not.toHaveBeenCalledWith("transactions");
    expect(mocks.from).not.toHaveBeenCalledWith("payment_attempts");
    expect(mocks.transactionInsert).not.toHaveBeenCalled();
    expect(mocks.paymentAttemptInsert).not.toHaveBeenCalled();
    expect(mocks.createSnapTransaction).not.toHaveBeenCalled();
  });

  it("does not look up or reuse an existing active checkout when readiness regresses", async () => {
    await expectReadinessRejection();

    expect(mocks.activeCheckoutMaybeSingle).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalledWith("transactions");
    expect(mocks.transactionInsert).not.toHaveBeenCalled();
    expect(mocks.paymentAttemptInsert).not.toHaveBeenCalled();
    expect(mocks.createSnapTransaction).not.toHaveBeenCalled();
  });
});
