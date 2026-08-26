export type PaymentState =
  | "creating"
  | "provider_create_unknown"
  | "awaiting_payment"
  | "paid"
  | "failed"
  | "expired"
  | "cancel_requested"
  | "cancelled"
  | "partially_reversed"
  | "reversed"
  | "requires_review";

export type TransactionType =
  | "initial_publish"
  | "tier_upgrade"
  | "renewal"
  | "draft_extension";

export type PricingSnapshot = {
  schema_version: number;
  transaction_type: TransactionType;
  tier_code?: string;
  product_code?: string;
  price_amount_idr: number;
  currency: string;
  duration_months?: number;
  duration_days?: number;
};

export type EntitlementSnapshot = {
  schema_version: number;
  tier_code: string;
  duration_months: number;
  gallery_limit: number;
  video_limit: number;
  bank_account_limit: number;
  audio_enabled: boolean;
  audio_size_limit_mb: number;
  watermark_enabled: boolean;
};

export type TransactionRow = {
  id: string;
  user_id: string | null;
  invitation_id: string | null;
  transaction_type: TransactionType;
  from_tier_id: string | null;
  to_tier_id: string | null;
  draft_extension_product_id: string | null;
  amount_idr: number;
  currency: string;
  pricing_snapshot: PricingSnapshot;
  entitlement_snapshot: EntitlementSnapshot | null;
  payment_provider: string | null;
  client_request_id: string | null;
  idempotency_fingerprint: string | null;
  payment_state: PaymentState;
  funded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentAttemptRow = {
  id: string;
  transaction_id: string;
  provider: string;
  attempt_no: number;
  order_id: string;
  snap_token_ciphertext: string | null;
  redirect_url_ciphertext: string | null;
  token_key_version: number | null;
  page_expires_at: string | null;
  provider_expires_at: string | null;
  snap_session_cancelled_at: string | null;
  provider_transaction_id: string | null;
  provider_status: string | null;
  fraud_status: string | null;
  payment_type: string | null;
  channel: string | null;
  acquirer: string | null;
  gross_amount_idr: number | null;
  provider_transaction_time: string | null;
  provider_settlement_time: string | null;
  create_state: "requested" | "created" | "unknown" | "failed";
  created_at: string;
  updated_at: string;
};

export function isFundedSuccess(
  transactionStatus: string,
  statusCode: string,
  fraudStatus?: string,
): boolean {
  if (statusCode !== "200") return false;
  if (transactionStatus === "settlement") {
    return !fraudStatus || fraudStatus === "accept";
  }
  if (transactionStatus === "capture") {
    return fraudStatus === "accept";
  }
  return false;
}

export function mapProviderStatusToPaymentState(
  transactionStatus: string,
  fraudStatus?: string,
): PaymentState {
  if (transactionStatus === "settlement") return "paid";
  if (transactionStatus === "capture") {
    if (fraudStatus === "accept") return "paid";
    if (fraudStatus === "challenge") return "requires_review";
    return "awaiting_payment";
  }
  if (transactionStatus === "pending") return "awaiting_payment";
  if (transactionStatus === "authorize") return "awaiting_payment";
  if (transactionStatus === "deny") return "failed";
  if (transactionStatus === "cancel") return "cancelled";
  if (transactionStatus === "expire") return "expired";
  if (transactionStatus === "failure") return "failed";
  if (transactionStatus === "refund") return "partially_reversed";
  if (transactionStatus === "partial_refund") return "partially_reversed";
  if (transactionStatus === "chargeback") return "reversed";
  if (transactionStatus === "partial_chargeback") return "partially_reversed";
  return "requires_review";
}

export function mergeEntitlements(
  existing: EntitlementSnapshot | null,
  incoming: EntitlementSnapshot,
): EntitlementSnapshot {
  if (!existing) return incoming;

  return {
    schema_version: Math.max(existing.schema_version, incoming.schema_version),
    tier_code: incoming.tier_code,
    duration_months: incoming.duration_months,
    gallery_limit: Math.max(existing.gallery_limit, incoming.gallery_limit),
    video_limit: Math.max(existing.video_limit, incoming.video_limit),
    bank_account_limit: Math.max(existing.bank_account_limit, incoming.bank_account_limit),
    audio_enabled: existing.audio_enabled || incoming.audio_enabled,
    audio_size_limit_mb: Math.max(existing.audio_size_limit_mb, incoming.audio_size_limit_mb),
    watermark_enabled: existing.watermark_enabled && incoming.watermark_enabled,
  };
}
