-- WP-REM-04: Secure Atomic Payment Webhook RPC
-- Replaces process_payment_webhook_atomic with a secure, trustless version

-- Drop the old insecure function
DROP FUNCTION IF EXISTS public.process_payment_webhook_atomic(
  UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, BOOLEAN, BOOLEAN, UUID, JSONB, TIMESTAMPTZ, UUID
);

-- Create the new secure function
CREATE OR REPLACE FUNCTION public.process_payment_webhook_atomic_v2(
  p_order_id TEXT,
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
  p_new_payment_state TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_attempt public.payment_attempts;
  v_tx public.transactions;
  v_invitation public.invitations;
  v_event_id UUID;
  v_is_funded BOOLEAN;
  v_should_apply_entitlement BOOLEAN;
  v_merged_entitlement JSONB;
  v_existing_entitlement JSONB;
  v_incoming_entitlement JSONB;
  v_new_expires_at TIMESTAMPTZ;
  v_email TEXT;
  v_slug TEXT;
BEGIN
  -- Check caller role (extra safety although REVOKE PUBLIC applies)
  IF current_setting('request.jwt.claim.role', true) != 'service_role' AND current_user != 'postgres' AND current_user != 'authenticator' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1. Get payment attempt details
  SELECT * INTO v_attempt FROM public.payment_attempts WHERE order_id = p_order_id;
  IF v_attempt.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found', 'message', 'Payment attempt not found for order_id');
  END IF;

  -- 2. Dedupe Event
  INSERT INTO public.payment_provider_events (
    transaction_id, payment_attempt_id, source,
    provider_status, fraud_status, payment_type,
    currency, merchant_id, status_code, gross_amount_idr,
    provider_transaction_id, provider_transaction_time,
    provider_settlement_time, event_fingerprint, payload_hash,
    applied_at, received_at
  ) VALUES (
    v_attempt.transaction_id, v_attempt.id, p_source,
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

  -- 3. Lock and Update Transaction
  SELECT * INTO v_tx FROM public.transactions WHERE id = v_attempt.transaction_id FOR UPDATE;
  
  -- Calculate is_funded based on provider status
  v_is_funded := FALSE;
  IF p_status_code = '200' THEN
    IF p_provider_status = 'settlement' AND (p_fraud_status IS NULL OR p_fraud_status = 'accept') THEN
      v_is_funded := TRUE;
    ELSIF p_provider_status = 'capture' AND p_fraud_status = 'accept' THEN
      v_is_funded := TRUE;
    END IF;
  END IF;

  -- Validate amount
  IF v_is_funded AND v_tx.amount_idr <> p_gross_amount_idr THEN
     RETURN jsonb_build_object('status', 'amount_mismatch');
  END IF;

  -- 4. Update Attempt
  UPDATE public.payment_attempts SET
    provider_status = p_provider_status,
    fraud_status = p_fraud_status,
    payment_type = p_payment_type,
    provider_transaction_id = p_provider_transaction_id,
    gross_amount_idr = p_gross_amount_idr,
    provider_transaction_time = p_provider_transaction_time,
    provider_settlement_time = p_provider_settlement_time,
    updated_at = NOW()
  WHERE id = v_attempt.id;

  v_should_apply_entitlement := (v_is_funded AND v_tx.funded_at IS NULL AND v_tx.invitation_id IS NOT NULL AND v_tx.entitlement_snapshot IS NOT NULL);

  -- 5. Apply Entitlement exactly once
  IF v_should_apply_entitlement THEN
    SELECT * INTO v_invitation FROM public.invitations WHERE id = v_tx.invitation_id FOR UPDATE;
    
    v_incoming_entitlement := v_tx.entitlement_snapshot;
    v_existing_entitlement := v_invitation.entitlement_snapshot;
    
    -- Merge Entitlement Logic in SQL
    IF v_existing_entitlement IS NULL THEN
      v_merged_entitlement := v_incoming_entitlement;
    ELSE
      v_merged_entitlement := jsonb_build_object(
        'schema_version', GREATEST((v_existing_entitlement->>'schema_version')::int, (v_incoming_entitlement->>'schema_version')::int),
        'tier_code', v_incoming_entitlement->>'tier_code',
        'duration_months', (v_incoming_entitlement->>'duration_months')::int,
        'gallery_limit', GREATEST((v_existing_entitlement->>'gallery_limit')::int, (v_incoming_entitlement->>'gallery_limit')::int),
        'video_limit', GREATEST((v_existing_entitlement->>'video_limit')::int, (v_incoming_entitlement->>'video_limit')::int),
        'bank_account_limit', GREATEST((v_existing_entitlement->>'bank_account_limit')::int, (v_incoming_entitlement->>'bank_account_limit')::int),
        'audio_enabled', (v_existing_entitlement->>'audio_enabled')::boolean OR (v_incoming_entitlement->>'audio_enabled')::boolean,
        'audio_size_limit_mb', GREATEST((v_existing_entitlement->>'audio_size_limit_mb')::int, (v_incoming_entitlement->>'audio_size_limit_mb')::int),
        'watermark_enabled', (v_existing_entitlement->>'watermark_enabled')::boolean AND (v_incoming_entitlement->>'watermark_enabled')::boolean
      );
    END IF;

    v_new_expires_at := NOW() + ((v_incoming_entitlement->>'duration_months')::int || ' months')::interval;

    UPDATE public.invitations SET
      entitlement_tier_id = v_tx.to_tier_id,
      entitlement_snapshot = v_merged_entitlement,
      expires_at = v_new_expires_at,
      updated_at = NOW()
    WHERE id = v_tx.invitation_id;
    
    UPDATE public.transactions SET
      payment_state = p_new_payment_state,
      funded_at = NOW(),
      updated_at = NOW()
    WHERE id = v_tx.id;

    -- Insert outbox event for receipt email atomicaly
    IF v_tx.user_id IS NOT NULL THEN
      SELECT email INTO v_email FROM public.user_profiles WHERE id = v_tx.user_id;
      SELECT slug INTO v_slug FROM public.invitations WHERE id = v_tx.invitation_id;
        
      IF v_email IS NOT NULL AND v_slug IS NOT NULL THEN
        INSERT INTO public.outbox_events (
          event_type, aggregate_type, aggregate_id, payload, status, available_at
        ) VALUES (
          'email', 'email_delivery', NULL,
          jsonb_build_object(
            'to', v_email,
            'template', 'payment_receipt',
            'idempotencyKey', 'email_payment_receipt_' || v_tx.id,
            'data', jsonb_build_object('invitationSlug', v_slug, 'tierName', COALESCE(v_incoming_entitlement->>'tier_code', v_tx.to_tier_id::text), 'duration', 'Active')
          ),
          'pending', NOW()
        );
      END IF;
    END IF;

    RETURN jsonb_build_object('status', 'funded', 'user_id', v_tx.user_id, 'invitation_id', v_tx.invitation_id, 'transaction_type', v_tx.transaction_type);
  END IF;

  -- Just update state if not funding/already funded
  UPDATE public.transactions SET
    payment_state = p_new_payment_state,
    updated_at = NOW()
  WHERE id = v_tx.id;

  RETURN jsonb_build_object('status', 'updated');
END;
$$;

-- Secure the new function
REVOKE ALL EXECUTE ON FUNCTION public.process_payment_webhook_atomic_v2(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_payment_webhook_atomic_v2(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO service_role;
