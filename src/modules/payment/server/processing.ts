import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { getMidtransEnv } from "@/shared/lib/env/server";
import { getTransactionStatus, type MidtransStatusResponse } from "@/modules/payment/provider/midtrans/client";
import { mapProviderStatusToPaymentState, parseIdrAmount } from "@/modules/payment/types";
import crypto from "crypto";

export async function processPaymentStatusAtomically(orderId: string, source: "webhook" | "status_poll", rawPayload?: Record<string, unknown>) {
  const env = getMidtransEnv();
  const supabase = createSupabaseServiceClient();

  let statusResponse: MidtransStatusResponse;
  try {
    statusResponse = await getTransactionStatus(orderId);
  } catch (error) {
    throw new Error("Status API unavailable");
  }

  const parsedAmount = parseIdrAmount(statusResponse.gross_amount);
  if (!parsedAmount.ok) throw new Error(`Invalid amount format: ${parsedAmount.error.code}`);
  const grossAmountIdr = parsedAmount.amountIdr;
  
  if (statusResponse.currency && statusResponse.currency !== "IDR") throw new Error("Invalid currency");
  if (statusResponse.merchant_id && env.MIDTRANS_MERCHANT_ID && statusResponse.merchant_id !== env.MIDTRANS_MERCHANT_ID) throw new Error("Merchant mismatch");

  const newPaymentState = mapProviderStatusToPaymentState(statusResponse.transaction_status, statusResponse.fraud_status);

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
    p_order_id: orderId,
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
  };

  const { data: rpcResult, error: rpcError } = await supabase.rpc("process_payment_webhook_atomic_v2", rpcPayload);

  if (rpcError) throw new Error("Database update failed: " + rpcError.message);
  if (rpcResult?.status === "amount_mismatch") throw new Error("Amount mismatch in RPC");
  if (rpcResult?.status === "not_found") throw new Error("Unknown order");

  return { status: "ok" };
}
