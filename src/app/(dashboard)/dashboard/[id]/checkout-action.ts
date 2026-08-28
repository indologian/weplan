"use server";

import { requireUser } from "@/modules/auth/server/require-user";
import { createCheckout } from "@/modules/payment/server/actions";
import crypto from "crypto";

export async function actionCreateCheckout(invitationId: string) {
  try {
    const user = await requireUser();
    const requestId = crypto.randomUUID();
    const result = await createCheckout(user.id, invitationId, requestId);
    return { success: true, redirectUrl: result.redirectUrl };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal membuat tagihan pembayaran." };
  }
}
