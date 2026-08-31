import "server-only";

import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { createSnapTransaction, cancelMidtransTransaction, type CreateSnapRequest } from "../provider/midtrans/client";
import type { PricingSnapshot, EntitlementSnapshot, TransactionRow } from "../types";
import { evaluatePublishReadiness } from "@/modules/invitation/server/publish-readiness-evaluator";

export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "ALREADY_ACTIVE" | "ALREADY_FUNDED" | "INVITATION_NOT_READY" | "PROVIDER_ERROR" | "DATABASE_ERROR" | "STATE_CONFLICT",
    public readonly activeCheckout?: ActiveCheckoutSummary,
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

export type ActiveCheckoutSummary = {
  transactionId: string;
  paymentState: string;
  canCancel: boolean;
};

const CHECKOUT_EXPIRY_MINUTES = 180; // 3 hours

export async function createCheckout(
  userId: string,
  invitationId: string,
  clientRequestId: string,
): Promise<{ transactionId: string; snapToken: string; redirectUrl: string }> {
  const supabase = createSupabaseServiceClient();

  // 1. Verify invitation ownership and eligibility
  const { data: invitation, error: invError } = await supabase
    .from("invitations")
    .select("id, user_id, status, theme_id, entitlement_tier_id")
    .eq("id", invitationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (invError) throw new PaymentError("Database error", "DATABASE_ERROR");
  if (!invitation) throw new PaymentError("Invitation not found", "NOT_FOUND");

  if (invitation.status !== "draft") {
    throw new PaymentError("Invitation is not in draft status", "INVITATION_NOT_READY");
  }

  if (invitation.entitlement_tier_id) {
    throw new PaymentError("Invitation already has entitlement", "ALREADY_ACTIVE");
  }

  // Validate publish readiness BEFORE ANY transaction logic (including reuse)
  const readiness = await evaluatePublishReadiness(userId, invitationId);
  if (!readiness.isReady) {
    throw new PaymentError("Invitation is not ready to publish. Please resolve missing requirements.", "INVITATION_NOT_READY");
  }

  // 2. Check for active checkout & reuse
  const { data: activeTx, error: activeTxError } = await supabase
    .from("transactions")
    .select("id, payment_state, amount_idr")
    .eq("invitation_id", invitationId)
    .in("payment_state", [
      "creating",
      "provider_create_unknown",
      "awaiting_payment",
      "cancel_requested",
      "requires_review",
    ])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeTxError) {
    throw new PaymentError("Failed to inspect active checkout", "DATABASE_ERROR");
  }

  // 3. Get theme tier pricing
  const { data: theme } = await supabase
    .from("themes")
    .select("id, tier_id")
    .eq("id", invitation.theme_id)
    .maybeSingle();

  if (!theme) throw new PaymentError("Theme not found", "NOT_FOUND");

  const { data: tier } = await supabase
    .from("tiers")
    .select("*")
    .eq("id", theme.tier_id)
    .maybeSingle();

  if (!tier) throw new PaymentError("Tier not found", "NOT_FOUND");

  if (activeTx) {
    if (activeTx.payment_state === "awaiting_payment" && activeTx.amount_idr === tier.price_amount) {
      const { data: activeAttempt, error: activeAttemptError } = await supabase
        .from("payment_attempts")
        .select("id, snap_token_ciphertext, redirect_url_ciphertext, page_expires_at")
        .eq("transaction_id", activeTx.id)
        .eq("create_state", "created")
        .order("attempt_no", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeAttemptError) {
        throw new PaymentError("Failed to inspect active payment attempt", "DATABASE_ERROR");
      }
      
      if (
        activeAttempt?.snap_token_ciphertext
        && activeAttempt.redirect_url_ciphertext
        && activeAttempt.page_expires_at
        && new Date(activeAttempt.page_expires_at) > new Date()
      ) {
        return {
          transactionId: activeTx.id,
          snapToken: activeAttempt.snap_token_ciphertext,
          redirectUrl: activeAttempt.redirect_url_ciphertext,
        };
      }
    }

    throw new PaymentError(
      activeTx.payment_state === "requires_review"
        ? "Checkout sebelumnya memerlukan pemeriksaan pembayaran."
        : "Checkout sebelumnya tidak dapat digunakan kembali.",
      "ALREADY_ACTIVE",
      {
        transactionId: activeTx.id,
        paymentState: activeTx.payment_state,
        canCancel: activeTx.payment_state !== "requires_review",
      },
    );
  }

  const pricingSnapshot: PricingSnapshot = {
    schema_version: 1,
    transaction_type: "initial_publish",
    tier_code: tier.code,
    price_amount_idr: tier.price_amount,
    currency: "IDR",
    duration_months: tier.duration_months,
  };

  const entitlementSnapshot: EntitlementSnapshot = {
    schema_version: 1,
    tier_code: tier.code,
    duration_months: tier.duration_months,
    gallery_limit: tier.gallery_limit,
    video_limit: tier.video_limit,
    bank_account_limit: tier.bank_account_limit,
    audio_enabled: tier.audio_enabled,
    audio_size_limit_mb: tier.audio_size_limit_mb,
    watermark_enabled: tier.watermark_enabled,
  };

  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      invitation_id: invitationId,
      transaction_type: "initial_publish",
      to_tier_id: tier.id,
      amount_idr: tier.price_amount,
      currency: "IDR",
      pricing_snapshot: pricingSnapshot,
      entitlement_snapshot: entitlementSnapshot,
      payment_provider: "midtrans",
      client_request_id: clientRequestId,
      idempotency_fingerprint: `${userId}:${invitationId}:initial_publish:${tier.id}`,
      payment_state: "creating",
    })
    .select("id")
    .single();

  if (txError) throw new PaymentError("Failed to create transaction", "DATABASE_ERROR");

  // 5. Create payment attempt
  const { randomUUID } = await import("crypto");
  const orderId = `ntx_${randomUUID().replace(/-/g, "").slice(0, 26)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CHECKOUT_EXPIRY_MINUTES * 60 * 1000);

  const { data: attempt, error: attemptError } = await supabase
    .from("payment_attempts")
    .insert({
      transaction_id: transaction.id,
      provider: "midtrans",
      attempt_no: 1,
      order_id: orderId,
      page_expires_at: expiresAt.toISOString(),
      create_state: "requested",
    })
    .select("id")
    .single();

  if (attemptError) throw new PaymentError("Failed to create payment attempt", "DATABASE_ERROR");

  // 6. Call Midtrans Snap API
  const { code: tierCode, price_amount } = tier;
  const snapPayload: CreateSnapRequest = {
    transaction_details: {
      order_id: orderId,
      gross_amount: price_amount,
    },
    item_details: [
      {
        id: tier.id,
        name: `Weplan ${tierCode.toUpperCase()} - Undangan Pernikahan`,
        price: price_amount,
        quantity: 1,
      },
    ],
    enabled_payments: ["credit_card", "bank_transfer", "gopay", "shopeepay", "qris"],
    credit_card: { secure: true },
    expiry: {
      start_time: now.toISOString(),
      duration: CHECKOUT_EXPIRY_MINUTES,
      unit: "minute",
    },
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/${invitationId}/edit`,
    },
  };

  let snapToken: string;
  let redirectUrl: string;

  try {
    const snapResponse = await createSnapTransaction(snapPayload);
    snapToken = snapResponse.token;
    redirectUrl = snapResponse.redirect_url;

    await supabase
      .from("payment_attempts")
      .update({
        create_state: "created",
        snap_token_ciphertext: snapToken, // Storing for reuse
        redirect_url_ciphertext: redirectUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);

    await supabase
      .from("transactions")
      .update({
        payment_state: "awaiting_payment",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);
  } catch {
    await supabase
      .from("payment_attempts")
      .update({
        create_state: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);

    await supabase
      .from("transactions")
      .update({
        payment_state: "provider_create_unknown",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    throw new PaymentError("Failed to create Snap transaction", "PROVIDER_ERROR");
  }

  return { transactionId: transaction.id, snapToken, redirectUrl };
}

export async function getActiveCheckout(userId: string, invitationId: string): Promise<TransactionRow | null> {
  const supabase = createSupabaseServiceClient();

  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("invitation_id", invitationId)
    .in("payment_state", ["creating", "provider_create_unknown", "awaiting_payment", "cancel_requested", "requires_review"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as TransactionRow | null;
}

export async function cancelCheckout(
  userId: string,
  transactionId: string,
  invitationId: string,
): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .select("id, payment_state, invitation_id")
    .eq("id", transactionId)
    .eq("user_id", userId)
    .eq("invitation_id", invitationId)
    .maybeSingle();

  if (transactionError) throw new PaymentError("Failed to inspect transaction", "DATABASE_ERROR");
  if (!transaction) throw new PaymentError("Transaction not found", "NOT_FOUND");

  const cancelableStates = [
    "creating",
    "provider_create_unknown",
    "awaiting_payment",
    "cancel_requested",
  ];
  if (!cancelableStates.includes(transaction.payment_state)) {
    throw new PaymentError("Transaction cannot be cancelled", "STATE_CONFLICT");
  }

  const { data: attempt, error: attemptError } = await supabase
    .from("payment_attempts")
    .select("order_id, create_state")
    .eq("transaction_id", transactionId)
    .order("attempt_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (attemptError) {
    throw new PaymentError("Failed to inspect payment attempt", "DATABASE_ERROR");
  }

  if (!attempt) {
    const { error } = await supabase
      .from("transactions")
      .update({ payment_state: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", transactionId)
      .in("payment_state", cancelableStates);
    if (error) throw new PaymentError("Failed to cancel checkout", "DATABASE_ERROR");
    return;
  }

  try {
    await cancelMidtransTransaction(attempt.order_id);
  } catch (error: unknown) {
    const providerError = error as { httpStatus?: number; providerStatusCode?: string };
    const providerCode = providerError.providerStatusCode
      ?? (providerError.httpStatus?.toString());

    if (providerCode === "404") {
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ payment_state: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", transactionId)
        .in("payment_state", cancelableStates);
      if (updateError) throw new PaymentError("Failed to cancel checkout", "DATABASE_ERROR");
      return;
    }

    if (providerCode !== "412") {
      await supabase
        .from("transactions")
        .update({ payment_state: "cancel_requested", updated_at: new Date().toISOString() })
        .eq("id", transactionId)
        .in("payment_state", cancelableStates);
      throw new PaymentError("Failed to cancel provider transaction", "PROVIDER_ERROR");
    }
  }

  const { processPaymentStatusAtomically } = await import("./processing");
  try {
    await processPaymentStatusAtomically(attempt.order_id, "status_poll");
  } catch {
    await supabase
      .from("transactions")
      .update({ payment_state: "cancel_requested", updated_at: new Date().toISOString() })
      .eq("id", transactionId)
      .in("payment_state", cancelableStates);
    throw new PaymentError(
      "Pembatalan sedang menunggu konfirmasi Midtrans.",
      "PROVIDER_ERROR",
    );
  }

  const { data: reconciled, error: reconcileError } = await supabase
    .from("transactions")
    .select("payment_state")
    .eq("id", transactionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (reconcileError || !reconciled) {
    throw new PaymentError("Failed to verify checkout cancellation", "DATABASE_ERROR");
  }

  if (["cancelled", "expired", "failed"].includes(reconciled.payment_state)) {
    return;
  }

  await supabase
    .from("transactions")
    .update({ payment_state: "cancel_requested", updated_at: new Date().toISOString() })
    .eq("id", transactionId)
    .in("payment_state", cancelableStates);

  if (reconciled.payment_state === "paid") {
    throw new PaymentError(
      "Pembayaran sudah diproses.",
      "ALREADY_FUNDED",
    );
  }

  throw new PaymentError(
    ["partially_reversed", "reversed"].includes(reconciled.payment_state)
      ? "Status pengembalian pembayaran memerlukan pemeriksaan."
      : "Pembatalan sedang menunggu konfirmasi Midtrans.",
    "STATE_CONFLICT",
  );
}

export async function publishPaidDraft(
  userId: string,
  invitationId: string,
): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("id, status, entitlement_tier_id, expires_at")
    .eq("id", invitationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (invitationError) throw new PaymentError("Failed to inspect invitation", "DATABASE_ERROR");
  if (!invitation) throw new PaymentError("Invitation not found", "NOT_FOUND");

  if (invitation.status !== "draft") {
    throw new PaymentError("Invitation is not in draft status", "INVITATION_NOT_READY");
  }

  if (!invitation.entitlement_tier_id) {
    throw new PaymentError("Invitation has no entitlement", "ALREADY_ACTIVE");
  }

  if (invitation.expires_at && new Date(invitation.expires_at) <= new Date()) {
    throw new PaymentError("Entitlement has expired", "STATE_CONFLICT");
  }

  // Use the canonical readiness validator
  const readiness = await evaluatePublishReadiness(userId, invitationId);
  if (!readiness.isReady) {
    throw new PaymentError("Invitation is not ready to publish", "INVITATION_NOT_READY");
  }

  const { data: publishedInvitation, error: publishError } = await supabase
    .from("invitations")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", invitationId)
    .eq("status", "draft")
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (publishError) {
    throw new PaymentError("Failed to publish invitation", "DATABASE_ERROR");
  }
  if (!publishedInvitation) {
    throw new PaymentError("Invitation state changed before publish", "STATE_CONFLICT");
  }
}
