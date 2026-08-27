-- WP-REM-03: Atomic Payment RPC
CREATE OR REPLACE FUNCTION process_payment_webhook_atomic(
  p_transaction_id UUID,
  p_payment_attempt_id UUID,
  p_event_fingerprint TEXT,
  p_payload_hash TEXT,
  p_source TEXT,
  p_provider_status TEXT,
  p_fraud_status TEXT,
  p_payment_type TEXT,
  p_currency TEXT,
  p_merchant_id TEXT,
  p_status_code TEXT,
  p_gross_amount_idr BIGINT,
  p_provider_transaction_id TEXT,
  p_provider_transaction_time TIMESTAMPTZ,
  p_provider_settlement_time TIMESTAMPTZ,
  p_new_payment_state TEXT,
  p_is_funded BOOLEAN,
  p_apply_entitlement BOOLEAN,
  p_invitation_id UUID,
  p_merged_entitlement JSONB,
  p_new_expires_at TIMESTAMPTZ,
  p_target_tier_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tx public.transactions;
  v_event_id UUID;
BEGIN
  -- 1. Dedupe Event
  INSERT INTO public.payment_provider_events (
    transaction_id, payment_attempt_id, source,
    provider_status, fraud_status, payment_type,
    currency, merchant_id, status_code, gross_amount_idr,
    provider_transaction_id, provider_transaction_time,
    provider_settlement_time, event_fingerprint, payload_hash,
    applied_at, received_at
  ) VALUES (
    p_transaction_id, p_payment_attempt_id, p_source,
    p_provider_status, p_fraud_status, p_payment_type,
    p_currency, p_merchant_id, p_status_code, p_gross_amount_idr,
    p_provider_transaction_id, p_provider_transaction_time,
    p_provider_settlement_time, p_event_fingerprint, p_payload_hash,
    NOW(), NOW()
  ) ON CONFLICT (event_fingerprint) DO NOTHING
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    -- Check if it was already applied
    IF EXISTS (SELECT 1 FROM public.payment_provider_events WHERE event_fingerprint = p_event_fingerprint AND applied_at IS NOT NULL) THEN
      RETURN jsonb_build_object('status', 'duplicate');
    END IF;
    -- Mark existing as applied
    UPDATE public.payment_provider_events SET applied_at = NOW() WHERE event_fingerprint = p_event_fingerprint;
  END IF;

  -- 2. Lock and Update Transaction (Lock first to prevent deadlocks)
  SELECT * INTO v_tx FROM public.transactions WHERE id = p_transaction_id FOR UPDATE;

  -- Validate amount
  IF p_is_funded AND v_tx.amount_idr <> p_gross_amount_idr THEN
     RETURN jsonb_build_object('status', 'amount_mismatch');
  END IF;

  -- 3. Update Attempt
  UPDATE public.payment_attempts SET
    provider_status = p_provider_status,
    fraud_status = p_fraud_status,
    payment_type = p_payment_type,
    provider_transaction_id = p_provider_transaction_id,
    gross_amount_idr = p_gross_amount_idr,
    provider_transaction_time = p_provider_transaction_time,
    provider_settlement_time = p_provider_settlement_time,
    updated_at = NOW()
  WHERE id = p_payment_attempt_id;

  -- 4. Apply Entitlement exactly once
  IF p_apply_entitlement AND v_tx.funded_at IS NULL AND p_is_funded AND p_invitation_id IS NOT NULL THEN
    UPDATE public.invitations SET
      entitlement_tier_id = p_target_tier_id,
      entitlement_snapshot = p_merged_entitlement,
      expires_at = p_new_expires_at,
      updated_at = NOW()
    WHERE id = p_invitation_id;
    
    UPDATE public.transactions SET
      payment_state = p_new_payment_state,
      funded_at = NOW(),
      updated_at = NOW()
    WHERE id = p_transaction_id;

    RETURN jsonb_build_object('status', 'funded', 'user_id', v_tx.user_id, 'invitation_id', p_invitation_id, 'transaction_type', v_tx.transaction_type);
  END IF;

  -- Just update state if not funding/already funded
  UPDATE public.transactions SET
    payment_state = p_new_payment_state,
    updated_at = NOW()
  WHERE id = p_transaction_id;

  RETURN jsonb_build_object('status', 'updated');
END;
$$;
