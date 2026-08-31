"use server";

import { requireUser } from "@/modules/auth/server/require-user";
import {
  cancelCheckout,
  createCheckout,
  PaymentError,
  publishPaidDraft,
} from "@/modules/payment/server/actions";
import crypto from "crypto";

function getCheckoutErrorMessage(error: PaymentError): string {
  switch (error.code) {
    case "INVITATION_NOT_READY":
      return "Undangan belum siap dipublikasikan.";
    case "PROVIDER_ERROR":
      return error.message.startsWith("Pembatalan")
        ? error.message
        : "Layanan pembayaran sedang bermasalah. Silakan coba lagi.";
    case "STATE_CONFLICT":
      return error.message;
    case "ALREADY_FUNDED":
      return "Pembayaran sudah diterima. Undangan akan dipublikasikan.";
    case "ALREADY_ACTIVE":
      return error.message;
    default:
      return "Gagal memproses checkout pembayaran.";
  }
}

export async function actionCreateCheckout(invitationId: string) {
  let userId: string | undefined;

  try {
    const user = await requireUser();
    userId = user.id;
    const requestId = crypto.randomUUID();
    const result = await createCheckout(userId, invitationId, requestId);
    return { success: true, published: false, redirectUrl: result.redirectUrl };
  } catch (error) {
    if (error instanceof PaymentError) {
      if (error.code === "ALREADY_ACTIVE" && !error.activeCheckout && userId) {
        try {
          await publishPaidDraft(userId, invitationId);
          return { success: true, published: true };
        } catch (publishError) {
          if (publishError instanceof PaymentError) {
            return {
              success: false,
              code: publishError.code,
              error: getCheckoutErrorMessage(publishError),
            };
          }

          return { success: false, error: "Gagal mempublikasikan undangan." };
        }
      }

      return {
        success: false,
        code: error.code,
        error: getCheckoutErrorMessage(error),
        activeCheckout: error.activeCheckout,
      };
    }

    return { success: false, error: "Gagal membuat tagihan pembayaran." };
  }
}

export async function actionCancelCheckout(
  invitationId: string,
  transactionId: string,
) {
  try {
    const user = await requireUser();
    await cancelCheckout(user.id, transactionId, invitationId);
    return { success: true };
  } catch (error) {
    if (error instanceof PaymentError) {
      return {
        success: false,
        code: error.code,
        error: getCheckoutErrorMessage(error),
      };
    }

    return { success: false, error: "Gagal membatalkan checkout pembayaran." };
  }
}
