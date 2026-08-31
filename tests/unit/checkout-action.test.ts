vi.mock("server-only", () => ({}));

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  actionCancelCheckout,
  actionCreateCheckout,
} from "@/app/(dashboard)/dashboard/[id]/checkout-action";
import { PaymentError } from "@/modules/payment/server/actions";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createCheckout: vi.fn(),
  publishPaidDraft: vi.fn(),
  cancelCheckout: vi.fn(),
}));

vi.mock("@/modules/auth/server/require-user", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("@/modules/payment/server/actions", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/modules/payment/server/actions")>();
  return {
    ...original,
    createCheckout: mocks.createCheckout,
    publishPaidDraft: mocks.publishPaidDraft,
    cancelCheckout: mocks.cancelCheckout,
  };
});

describe("checkout server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user-1" });
  });

  it("publishes a funded draft without creating another payment", async () => {
    mocks.createCheckout.mockRejectedValue(new PaymentError(
      "Invitation already has entitlement",
      "ALREADY_ACTIVE",
    ));
    mocks.publishPaidDraft.mockResolvedValue(undefined);

    await expect(actionCreateCheckout("invitation-1")).resolves.toEqual({
      success: true,
      published: true,
    });
    expect(mocks.publishPaidDraft).toHaveBeenCalledWith("user-1", "invitation-1");
  });

  it("returns active-checkout details without attempting publication", async () => {
    mocks.createCheckout.mockRejectedValue(new PaymentError(
      "Checkout sebelumnya tidak dapat digunakan kembali.",
      "ALREADY_ACTIVE",
      {
        transactionId: "transaction-1",
        paymentState: "awaiting_payment",
        canCancel: true,
      },
    ));

    await expect(actionCreateCheckout("invitation-1")).resolves.toMatchObject({
      success: false,
      code: "ALREADY_ACTIVE",
      activeCheckout: { transactionId: "transaction-1" },
    });
    expect(mocks.publishPaidDraft).not.toHaveBeenCalled();
  });

  it("scopes cancellation to the authenticated user and invitation", async () => {
    mocks.cancelCheckout.mockResolvedValue(undefined);

    await expect(actionCancelCheckout("invitation-1", "transaction-1"))
      .resolves.toEqual({ success: true });
    expect(mocks.cancelCheckout).toHaveBeenCalledWith(
      "user-1",
      "transaction-1",
      "invitation-1",
    );
  });
});
