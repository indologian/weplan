import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { getMidtransEnv } from "@/shared/lib/env/server";
import { verifyNotificationSignature, getTransactionStatus, type MidtransStatusResponse } from "@/modules/payment/provider/midtrans/client";
import { isFundedSuccess, mapProviderStatusToPaymentState, mergeEntitlements, type EntitlementSnapshot } from "@/modules/payment/types";
import { assertValidTransition } from "@/modules/payment/state-machine";
import { enqueuePaymentReceiptEmail } from "@/modules/jobs/server/enqueue";
import crypto from "crypto";

function computeEventFingerprint(body: Record<string, unknown>): string {
  const canonical = [
    body.order_id,
    body.status_code,
    body.gross_amount,
    body.transaction_status,
    body.transaction_id,
    body.fraud_status,
  ].join("|");
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // 1. Verify signature
    const env = getMidtransEnv();
    const signatureKey = body.signature_key as string;
    const orderId = body.order_id as string;
    const statusCode = body.status_code as string;
    const grossAmount = body.gross_amount as string;

    if (!signatureKey || !orderId || !statusCode || !grossAmount) {
      return NextResponse.json({ status: "error", message: "Missing required fields" }, { status: 400 });
    }

    const isValid = verifyNotificationSignature(orderId, statusCode, grossAmount, env.MIDTRANS_SERVER_KEY, signatureKey);
    if (!isValid) {
      return NextResponse.json({ status: "error", message: "Invalid signature" }, { status: 403 });
    }

    // 2. Get transaction and attempt from database
    const supabase = createSupabaseServiceClient();

    const { data: attempt } = await supabase
      .from("payment_attempts")
      .select("id, transaction_id, order_id, provider_transaction_id")
      .eq("order_id", orderId)
      .maybeSingle();

    if (!attempt) {
      return NextResponse.json({ status: "ok", message: "Unknown order" });
    }

    const { data: transaction } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", attempt.transaction_id)
      .maybeSingle();

    if (!transaction) {
      return NextResponse.json({ status: "error", message: "Transaction not found" }, { status: 404 });
    }

    // 3. Dedupe provider event
    const eventFingerprint = computeEventFingerprint(body);
    const payloadHash = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");

    const { data: existingEvent } = await supabase
      .from("payment_provider_events")
      .select("id, applied_at")
      .eq("event_fingerprint", eventFingerprint)
      .maybeSingle();

    if (existingEvent?.applied_at) {
      return NextResponse.json({ status: "ok", message: "Duplicate event" });
    }

    // 4. Record provider event
    if (!existingEvent) {
      await supabase.from("payment_provider_events").insert({
        transaction_id: transaction.id,
        payment_attempt_id: attempt.id,
        source: "webhook",
        provider_status: body.transaction_status,
        fraud_status: body.fraud_status,
        payment_type: body.payment_type,
        currency: body.currency,
        merchant_id: body.merchant_id,
        status_code: body.status_code,
        gross_amount_idr: Math.round(parseFloat(grossAmount)),
        provider_transaction_id: body.transaction_id,
        provider_transaction_time: body.transaction_time,
        provider_settlement_time: body.settlement_time,
        event_fingerprint: eventFingerprint,
        payload_hash: payloadHash,
      });
    }

    // 5. Get latest status from Status API
    let statusResponse: MidtransStatusResponse;
    try {
      statusResponse = await getTransactionStatus(orderId);
    } catch {
      return NextResponse.json({ status: "error", message: "Status API unavailable" }, { status: 503 });
    }

    // 6. Map to payment state
    const newPaymentState = mapProviderStatusToPaymentState(
      statusResponse.transaction_status,
      statusResponse.fraud_status,
    );

    // 7. Check if transition is valid
    const currentState = transaction.payment_state;
    if (newPaymentState !== currentState) {
      try {
        assertValidTransition(currentState, newPaymentState);
      } catch {
        return NextResponse.json({ status: "ok", message: "State transition not applicable" });
      }
    }

    // 8. Apply funded-success if applicable
    const funded = isFundedSuccess(
      statusResponse.transaction_status,
      statusResponse.status_code,
      statusResponse.fraud_status,
    );

    const updatePayload: Record<string, unknown> = {
      payment_state: newPaymentState,
      updated_at: new Date().toISOString(),
    };

    if (funded && !transaction.funded_at) {
      updatePayload.funded_at = new Date().toISOString();

      // Apply entitlement to invitation
      if (transaction.entitlement_snapshot && transaction.invitation_id) {
        const { data: currentInvitation } = await supabase
          .from("invitations")
          .select("entitlement_tier_id, entitlement_snapshot")
          .eq("id", transaction.invitation_id)
          .maybeSingle();

        const incomingEntitlement = transaction.entitlement_snapshot as EntitlementSnapshot;
        const mergedEntitlement = mergeEntitlements(
          currentInvitation?.entitlement_snapshot as EntitlementSnapshot | null,
          incomingEntitlement,
        );

        const durationMonths = incomingEntitlement.duration_months;
        const expiresAt = new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000);

        await supabase
          .from("invitations")
          .update({
            entitlement_tier_id: transaction.to_tier_id,
            entitlement_snapshot: mergedEntitlement,
            expires_at: expiresAt.toISOString(),
          })
          .eq("id", transaction.invitation_id);
      }
    }

    // 9. Update attempt with provider details
    await supabase
      .from("payment_attempts")
      .update({
        provider_status: statusResponse.transaction_status,
        fraud_status: statusResponse.fraud_status,
        payment_type: statusResponse.payment_type,
        provider_transaction_id: statusResponse.transaction_id,
        gross_amount_idr: Math.round(parseFloat(statusResponse.gross_amount)),
        provider_transaction_time: statusResponse.transaction_time,
        provider_settlement_time: statusResponse.settlement_time,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);

    // 10. Update transaction
    await supabase
      .from("transactions")
      .update(updatePayload)
      .eq("id", transaction.id);

    // 11. Mark provider event as applied
    if (existingEvent) {
      await supabase
        .from("payment_provider_events")
        .update({ applied_at: new Date().toISOString() })
        .eq("id", existingEvent.id);
    } else {
      await supabase
        .from("payment_provider_events")
        .update({ applied_at: new Date().toISOString() })
        .eq("event_fingerprint", eventFingerprint);
    }

    // 12. Enqueue email receipt on funded-success
    if (funded && !transaction.funded_at && transaction.invitation_id) {
      try {
        const { data: owner } = await supabase
          .from("user_profiles")
          .select("email")
          .eq("id", transaction.user_id)
          .maybeSingle();

        const { data: inv } = await supabase
          .from("invitations")
          .select("slug")
          .eq("id", transaction.invitation_id)
          .maybeSingle();

        if (owner?.email && inv?.slug) {
          await enqueuePaymentReceiptEmail(
            owner.email,
            inv.slug,
            transaction.transaction_type,
            "Active",
          );
        }
      } catch {
        console.error("[WEBHOOK] Failed to enqueue receipt email");
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ status: "error", message: "Internal error" }, { status: 500 });
  }
}
