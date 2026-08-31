/**
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutButton } from "@/app/(dashboard)/dashboard/[id]/checkout-button";

const mocks = vi.hoisted(() => ({
  evaluateReadiness: vi.fn(),
  createCheckout: vi.fn(),
  cancelCheckout: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/modules/invitation/client-actions", () => ({
  actionEvaluatePublishReadiness: mocks.evaluateReadiness,
}));

vi.mock("@/app/(dashboard)/dashboard/[id]/checkout-action", () => ({
  actionCreateCheckout: mocks.createCheckout,
  actionCancelCheckout: mocks.cancelCheckout,
}));

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError },
}));

describe("CheckoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.evaluateReadiness.mockResolvedValue({
      success: true,
      data: { isReady: true, issues: [] },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("offers cancellation when an existing checkout cannot be reused", async () => {
    mocks.createCheckout
      .mockResolvedValueOnce({
        success: false,
        code: "ALREADY_ACTIVE",
        error: "Checkout sebelumnya tidak dapat digunakan kembali.",
        activeCheckout: {
          transactionId: "transaction-1",
          paymentState: "awaiting_payment",
          canCancel: true,
        },
      })
      .mockResolvedValueOnce({
        success: false,
        error: "Checkout baru gagal dibuat.",
      });
    mocks.cancelCheckout.mockResolvedValue({ success: true });

    render(
      <CheckoutButton
        invitationId="invitation-1"
        flushEditorBeforeCheckout={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Publish & Bayar" }));
    expect(await screen.findByText("Checkout sebelumnya masih aktif")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Batalkan & Buat Baru" }));

    await waitFor(() => {
      expect(mocks.cancelCheckout).toHaveBeenCalledWith(
        "invitation-1",
        "transaction-1",
      );
      expect(mocks.createCheckout).toHaveBeenCalledTimes(2);
    });
  });
});
