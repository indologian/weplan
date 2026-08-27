import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { getMidtransEnv } from "@/shared/lib/env/server";
import { getTransactionStatus, type MidtransStatusResponse } from "@/modules/payment/provider/midtrans/client";
import { isFundedSuccess, mapProviderStatusToPaymentState, mergeEntitlements, type EntitlementSnapshot } from "@/modules/payment/types";
import { assertValidTransition } from "@/modules/payment/state-machine";
import { enqueuePaymentReceiptEmail } from "@/modules/jobs/server/enqueue";
import crypto from "crypto";

function parseAmount(amountStr: string | null | undefined): number {
  if (!amountStr) return 0;
  return parseInt(amountStr.split(".")[0] || "0", 10);
}

export async function processPaymentStatusAtomically(orderId: string, source: "webhook" | "status_poll", rawPayload?: Record<string, unknown>) {
  const env = getMidtransEnv();
  const supabase = createSupabaseServiceClient();

  const { data: attempt } = await supabase
    .from("payment_attempts")
    .select("id, transaction_id, order_id, provider_transaction_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!attempt) return { status: "ok", message: "Unknown order" };

  const { data: transaction } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", attempt.transaction_id)
    .maybeSingle();

  if (!transaction) throw new Error("Transaction not found");

  let statusResponse: MidtransStatusResponse;
  try {
    statusResponse = await getTransactionStatus(orderId);
  } catch (error) {
    throw new Error("Status API unavailable");
  }

  const grossAmountIdr = parseAmount(statusResponse.gross_amount);
  if (statusResponse.currency && statusResponse.currency !== "IDR") throw new Error("Invalid currency");
  if (transaction.amount_idr !== grossAmountIdr) throw new Error("Amount mismatch");
  if (statusResponse.merchant_id && env.MIDTRANS_MERCHANT_ID && statusResponse.merchant_id !== env.MIDTRANS_MERCHANT_ID) throw new Error("Merchant mismatch");

  const newPaymentState = mapProviderStatusToPaymentState(statusResponse.transaction_status, statusResponse.fraud_status);

  const currentState = transaction.payment_state;
  if (newPaymentState !== currentState) {
    try {
      assertValidTransition(currentState, newPaymentState);
    } catch {
      return { status: "ok", message: "State transition not applicable" };
    }
  }

  const funded = isFundedSuccess(statusResponse.transaction_status, statusResponse.status_code, statusResponse.fraud_status);
  let mergedEntitlement: EntitlementSnapshot | null = null;
  let expiresAt: string | null = null;
  const shouldApplyEntitlement = funded && !transaction.funded_at && !!transaction.invitation_id && !!transaction.entitlement_snapshot;

  if (shouldApplyEntitlement) {
    const { data: currentInvitation } = await supabase
      .from("invitations")
      .select("entitlement_tier_id, entitlement_snapshot")
      .eq("id", transaction.invitation_id)
      .maybeSingle();

    const incomingEntitlement = transaction.entitlement_snapshot as EntitlementSnapshot;
    mergedEntitlement = mergeEntitlements(
      currentInvitation?.entitlement_snapshot as EntitlementSnapshot | null,
      incomingEntitlement,
    );
    const durationMonths = incomingEntitlement.duration_months;
    expiresAt = new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  const payloadToHash = rawPayload || statusResponse;
  const canonical = [
    statusResponse.order_id,
    statusResponse.status_code,
    statusResponse.gross_amount,
    statusResponse.transaction_status,
    statusResponse.transaction_id,
    statusResponse.fraud_status,
  ].join("|");
  
  const eventFingerprint = crypto.createHash("sha256").update(canonical).digest("hex");
  const payloadHash = crypto.createHash("sha256").update(JSON.stringify(payloadToHash)).digest("hex");

  const rpcPayload = {
    p_transaction_id: transaction.id,
    p_payment_attempt_id: attempt.id,
    p_event_fingerprint: eventFingerprint,
    p_payload_hash: payloadHash,
    p_source: source,
    p_provider_status: statusResponse.transaction_status || null,
    p_fraud_status: statusResponse.fraud_status || null,
    p_payment_type: statusResponse.payment_type || null,
    p_currency: statusResponse.currency || null,
    p_merchant_id: statusResponse.merchant_id || null,
    p_status_code: statusResponse.status_code || null,
    p_gross_amount_idr: grossAmountIdr,
    p_provider_transaction_id: statusResponse.transaction_id || null,
    p_provider_transaction_time: statusResponse.transaction_time || null,
    p_provider_settlement_time: statusResponse.settlement_time || null,
    p_new_payment_state: newPaymentState,
    p_is_funded: funded,
    p_apply_entitlement: shouldApplyEntitlement,
    p_invitation_id: transaction.invitation_id || null,
    p_merged_entitlement: mergedEntitlement || null,
    p_new_expires_at: expiresAt || null,
    p_target_tier_id: transaction.to_tier_id || null,
  };

  const { data: rpcResult, error: rpcError } = await supabase.rpc("process_payment_webhook_atomic", rpcPayload);

  if (rpcError) throw new Error("Database update failed");
  if (rpcResult?.status === "amount_mismatch") throw new Error("Amount mismatch in RPC");

  if (rpcResult?.status === "funded" && rpcResult.user_id && rpcResult.invitation_id) {
    try {
      const { data: owner } = await supabase.from("user_profiles").select("email").eq("id", rpcResult.user_id).maybeSingle();
      const { data: inv } = await supabase.from("invitations").select("slug").eq("id", rpcResult.invitation_id).maybeSingle();

      if (owner?.email && inv?.slug) {
        await enqueuePaymentReceiptEmail(owner.email, inv.slug, rpcResult.transaction_type, "Active");
      }
    } catch (err) {
      console.error("[WEBHOOK] Failed to enqueue receipt email", err);
    }
  }

  return { status: "ok" };
}
