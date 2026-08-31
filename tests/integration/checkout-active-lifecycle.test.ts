vi.mock("server-only", () => ({}));

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelCheckout,
  createCheckout,
  PaymentError,
  publishPaidDraft,
} from "@/modules/payment/server/actions";
import { evaluatePublishReadiness } from "@/modules/invitation/server/publish-readiness-evaluator";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  createSnapTransaction: vi.fn(),
  cancelMidtransTransaction: vi.fn(),
  processPaymentStatusAtomically: vi.fn(),
}));

vi.mock("@/modules/invitation/server/publish-readiness-evaluator", () => ({
  evaluatePublishReadiness: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/service-client", () => ({
  createSupabaseServiceClient: vi.fn(() => ({ from: mocks.from })),
}));

vi.mock("@/modules/payment/provider/midtrans/client", () => ({
  createSnapTransaction: mocks.createSnapTransaction,
  cancelMidtransTransaction: mocks.cancelMidtransTransaction,
}));

vi.mock("@/modules/payment/server/processing", () => ({
  processPaymentStatusAtomically: mocks.processPaymentStatusAtomically,
}));

function queryWith(data: unknown) {
  const query = {
    error: null,
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };

  query.select.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  return query;
}

const invitation = {
  id: "invitation-1",
  user_id: "user-1",
  status: "draft",
  theme_id: "theme-1",
  entitlement_tier_id: null,
};

const activeTransaction = {
  id: "transaction-1",
  payment_state: "awaiting_payment",
  amount_idr: 149000,
};

describe("active checkout lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(evaluatePublishReadiness).mockResolvedValue({
      isReady: true,
      issues: [],
    });
  });

  it("reuses an unexpired checkout without creating payment side effects", async () => {
    const tables = {
      invitations: queryWith(invitation),
      transactions: queryWith(activeTransaction),
      themes: queryWith({ id: "theme-1", tier_id: "tier-1" }),
      tiers: queryWith({ id: "tier-1", price_amount: 149000 }),
      payment_attempts: queryWith({
        id: "attempt-1",
        snap_token_ciphertext: "snap-token",
        redirect_url_ciphertext: "https://app.sandbox.midtrans.com/snap/v4/redirection/token",
        page_expires_at: new Date(Date.now() + 60_000).toISOString(),
      }),
    };
    mocks.from.mockImplementation((table: keyof typeof tables) => tables[table]);

    await expect(createCheckout("user-1", "invitation-1", "request-1"))
      .resolves.toEqual({
        transactionId: "transaction-1",
        snapToken: "snap-token",
        redirectUrl: "https://app.sandbox.midtrans.com/snap/v4/redirection/token",
      });
    expect(mocks.createSnapTransaction).not.toHaveBeenCalled();
    expect(tables.transactions.insert).not.toHaveBeenCalled();
  });

  it("returns cancellable checkout details when the Snap session expired", async () => {
    const tables = {
      invitations: queryWith(invitation),
      transactions: queryWith(activeTransaction),
      themes: queryWith({ id: "theme-1", tier_id: "tier-1" }),
      tiers: queryWith({ id: "tier-1", price_amount: 149000 }),
      payment_attempts: queryWith({
        id: "attempt-1",
        snap_token_ciphertext: "expired-token",
        redirect_url_ciphertext: "https://app.sandbox.midtrans.com/expired",
        page_expires_at: new Date(Date.now() - 60_000).toISOString(),
      }),
    };
    mocks.from.mockImplementation((table: keyof typeof tables) => tables[table]);

    await expect(createCheckout("user-1", "invitation-1", "request-1"))
      .rejects.toMatchObject({
        code: "ALREADY_ACTIVE",
        activeCheckout: {
          transactionId: "transaction-1",
          paymentState: "awaiting_payment",
          canCancel: true,
        },
      });
    expect(mocks.createSnapTransaction).not.toHaveBeenCalled();
  });

  it("cancels locally only when Midtrans confirms the order does not exist", async () => {
    const transactionQuery = queryWith({
      id: "transaction-1",
      payment_state: "provider_create_unknown",
      invitation_id: "invitation-1",
    });
    const attemptQuery = queryWith({ order_id: "order-1", create_state: "failed" });
    mocks.from.mockImplementation((table: string) => (
      table === "transactions" ? transactionQuery : attemptQuery
    ));
    mocks.cancelMidtransTransaction.mockRejectedValue({
      httpStatus: 404,
      providerStatusCode: "404",
    });

    await expect(cancelCheckout("user-1", "transaction-1", "invitation-1"))
      .resolves.toBeUndefined();
    expect(transactionQuery.update).toHaveBeenCalledWith(expect.objectContaining({
      payment_state: "cancelled",
    }));
    expect(mocks.processPaymentStatusAtomically).not.toHaveBeenCalled();
  });

  it("reconciles a Midtrans 412 and refuses a second checkout after payment", async () => {
    const activeQuery = queryWith({
      id: "transaction-1",
      payment_state: "awaiting_payment",
      invitation_id: "invitation-1",
    });
    const reconciledQuery = queryWith({ payment_state: "paid" });
    const updateQuery = queryWith(null);
    let transactionCall = 0;
    mocks.from.mockImplementation((table: string) => {
      if (table === "payment_attempts") {
        return queryWith({ order_id: "order-1", create_state: "created" });
      }
      transactionCall += 1;
      if (transactionCall === 1) return activeQuery;
      if (transactionCall === 2) return reconciledQuery;
      return updateQuery;
    });
    mocks.cancelMidtransTransaction.mockRejectedValue({
      httpStatus: 412,
      providerStatusCode: "412",
    });
    mocks.processPaymentStatusAtomically.mockResolvedValue({ status: "ok" });

    const cancellation = cancelCheckout("user-1", "transaction-1", "invitation-1");
    await expect(cancellation).rejects.toBeInstanceOf(PaymentError);
    await expect(cancellation).rejects.toMatchObject({
      code: "ALREADY_FUNDED",
      message: expect.stringContaining("sudah diproses"),
    });
    expect(mocks.processPaymentStatusAtomically).toHaveBeenCalledWith(
      "order-1",
      "status_poll",
    );
  });

  it("allows replacement only after reconciliation confirms cancellation", async () => {
    const activeQuery = queryWith({
      id: "transaction-1",
      payment_state: "awaiting_payment",
      invitation_id: "invitation-1",
    });
    const reconciledQuery = queryWith({ payment_state: "cancelled" });
    let transactionCall = 0;
    mocks.from.mockImplementation((table: string) => {
      if (table === "payment_attempts") {
        return queryWith({ order_id: "order-1", create_state: "created" });
      }
      transactionCall += 1;
      return transactionCall === 1 ? activeQuery : reconciledQuery;
    });
    mocks.cancelMidtransTransaction.mockResolvedValue({
      status_code: "200",
      status_message: "Success, transaction is canceled",
    });
    mocks.processPaymentStatusAtomically.mockResolvedValue({ status: "ok" });

    await expect(cancelCheckout("user-1", "transaction-1", "invitation-1"))
      .resolves.toBeUndefined();
    expect(mocks.processPaymentStatusAtomically).toHaveBeenCalledWith(
      "order-1",
      "status_poll",
    );
  });

  it("fails closed when the payment-attempt query fails", async () => {
    const transactionQuery = queryWith({
      id: "transaction-1",
      payment_state: "awaiting_payment",
      invitation_id: "invitation-1",
    });
    const attemptQuery = queryWith(null);
    attemptQuery.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "database unavailable" },
    });
    mocks.from.mockImplementation((table: string) => (
      table === "transactions" ? transactionQuery : attemptQuery
    ));

    await expect(cancelCheckout("user-1", "transaction-1", "invitation-1"))
      .rejects.toMatchObject({ code: "DATABASE_ERROR" });
    expect(mocks.cancelMidtransTransaction).not.toHaveBeenCalled();
    expect(transactionQuery.update).not.toHaveBeenCalled();
  });

  it("publishes a ready draft that already has a valid entitlement", async () => {
    const invitationQuery = queryWith({
      id: "invitation-1",
      status: "draft",
      entitlement_tier_id: "tier-1",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    });
    const publishQuery = queryWith({ id: "invitation-1" });
    let invitationCall = 0;
    mocks.from.mockImplementation(() => {
      invitationCall += 1;
      return invitationCall === 1 ? invitationQuery : publishQuery;
    });

    await expect(publishPaidDraft("user-1", "invitation-1"))
      .resolves.toBeUndefined();
    expect(publishQuery.update).toHaveBeenCalledWith(expect.objectContaining({
      status: "published",
    }));
  });

  it("fails publication when the draft state changes during the CAS update", async () => {
    const invitationQuery = queryWith({
      id: "invitation-1",
      status: "draft",
      entitlement_tier_id: "tier-1",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    });
    const publishQuery = queryWith(null);
    let invitationCall = 0;
    mocks.from.mockImplementation(() => {
      invitationCall += 1;
      return invitationCall === 1 ? invitationQuery : publishQuery;
    });

    await expect(publishPaidDraft("user-1", "invitation-1"))
      .rejects.toMatchObject({ code: "STATE_CONFLICT" });
  });
});
