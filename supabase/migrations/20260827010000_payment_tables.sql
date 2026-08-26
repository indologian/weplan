-- M4: Payment tables, triggers, and RLS
-- transactions, payment_attempts, payment_provider_events

-- ============================================================
-- 1. transactions
-- ============================================================
CREATE TABLE transactions (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  invitation_id              UUID REFERENCES invitations(id) ON DELETE SET NULL,

  transaction_type           TEXT NOT NULL
                             CHECK (transaction_type IN ('initial_publish','tier_upgrade','renewal','draft_extension')),
  from_tier_id               UUID REFERENCES tiers(id),
  to_tier_id                 UUID REFERENCES tiers(id),
  draft_extension_product_id UUID REFERENCES draft_extension_products(id),

  amount_idr                 BIGINT NOT NULL CHECK (amount_idr >= 0),
  currency                   TEXT NOT NULL DEFAULT 'IDR' CHECK (currency = 'IDR'),
  pricing_snapshot           JSONB NOT NULL CHECK (jsonb_typeof(pricing_snapshot) = 'object'),
  entitlement_snapshot       JSONB CHECK (entitlement_snapshot IS NULL OR jsonb_typeof(entitlement_snapshot) = 'object'),

  payment_provider           TEXT CHECK (payment_provider IS NULL OR payment_provider = 'midtrans'),
  client_request_id          TEXT,
  idempotency_fingerprint    TEXT,
  payment_state              TEXT NOT NULL DEFAULT 'creating'
                             CHECK (payment_state IN (
                               'creating','provider_create_unknown','awaiting_payment','paid','failed','expired',
                               'cancel_requested','cancelled','partially_reversed','reversed','requires_review'
                             )),
  funded_at                  TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK ((client_request_id IS NULL) = (idempotency_fingerprint IS NULL)),
  CHECK ((amount_idr = 0 AND payment_provider IS NULL) OR (amount_idr > 0 AND payment_provider = 'midtrans')),
  CHECK (
    (transaction_type = 'draft_extension'
      AND from_tier_id IS NULL AND to_tier_id IS NULL
      AND draft_extension_product_id IS NOT NULL
      AND entitlement_snapshot IS NULL)
    OR
    (transaction_type = 'initial_publish'
      AND from_tier_id IS NULL AND to_tier_id IS NOT NULL
      AND draft_extension_product_id IS NULL
      AND entitlement_snapshot IS NOT NULL)
    OR
    (transaction_type = 'tier_upgrade'
      AND from_tier_id IS NOT NULL AND to_tier_id IS NOT NULL
      AND from_tier_id <> to_tier_id
      AND draft_extension_product_id IS NULL
      AND entitlement_snapshot IS NOT NULL)
    OR
    (transaction_type = 'renewal'
      AND from_tier_id IS NOT NULL AND to_tier_id = from_tier_id
      AND draft_extension_product_id IS NULL
      AND entitlement_snapshot IS NOT NULL)
  ),
  CHECK (payment_state NOT IN ('paid','partially_reversed','reversed') OR funded_at IS NOT NULL)
);

CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX idx_transactions_invitation_created ON transactions(invitation_id, created_at DESC)
  WHERE invitation_id IS NOT NULL;
CREATE INDEX idx_transactions_reconcile
  ON transactions(updated_at, id)
  WHERE payment_state IN ('creating','provider_create_unknown','awaiting_payment','cancel_requested','requires_review');
CREATE INDEX idx_transactions_from_tier ON transactions(from_tier_id) WHERE from_tier_id IS NOT NULL;
CREATE INDEX idx_transactions_to_tier ON transactions(to_tier_id) WHERE to_tier_id IS NOT NULL;
CREATE INDEX idx_transactions_extension_product ON transactions(draft_extension_product_id)
  WHERE draft_extension_product_id IS NOT NULL;
CREATE UNIQUE INDEX uq_transaction_client_request
  ON transactions(user_id, client_request_id)
  WHERE user_id IS NOT NULL AND client_request_id IS NOT NULL;
CREATE UNIQUE INDEX uq_one_active_commercial_checkout_per_invitation
  ON transactions(invitation_id)
  WHERE invitation_id IS NOT NULL
    AND payment_state IN ('creating','provider_create_unknown','awaiting_payment','cancel_requested','requires_review');

-- ============================================================
-- 2. payment_attempts
-- ============================================================
CREATE TABLE payment_attempts (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id             UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  provider                   TEXT NOT NULL CHECK (provider = 'midtrans'),
  attempt_no                 INT NOT NULL DEFAULT 1 CHECK (attempt_no >= 1),
  order_id                   TEXT NOT NULL UNIQUE CHECK (char_length(order_id) BETWEEN 1 AND 50),
  snap_token_ciphertext      TEXT,
  redirect_url_ciphertext    TEXT,
  token_key_version          INT CHECK (token_key_version IS NULL OR token_key_version > 0),
  page_expires_at            TIMESTAMPTZ,
  provider_expires_at        TIMESTAMPTZ,
  snap_session_cancelled_at  TIMESTAMPTZ,

  provider_transaction_id    TEXT,
  provider_status            TEXT,
  fraud_status               TEXT,
  payment_type               TEXT,
  channel                    TEXT,
  acquirer                   TEXT,
  gross_amount_idr           BIGINT CHECK (gross_amount_idr IS NULL OR gross_amount_idr >= 0),
  provider_transaction_time  TIMESTAMPTZ,
  provider_settlement_time   TIMESTAMPTZ,

  create_state               TEXT NOT NULL DEFAULT 'requested'
                             CHECK (create_state IN ('requested','created','unknown','failed')),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (transaction_id, attempt_no),
  UNIQUE (id, transaction_id),
  CHECK ((snap_token_ciphertext IS NULL AND redirect_url_ciphertext IS NULL) OR token_key_version IS NOT NULL)
);

CREATE UNIQUE INDEX uq_midtrans_transaction_id
  ON payment_attempts(provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;
CREATE INDEX idx_payment_attempts_provider_status
  ON payment_attempts(provider_status) WHERE provider_status IS NOT NULL;

-- ============================================================
-- 3. payment_provider_events
-- ============================================================
CREATE TABLE payment_provider_events (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id             UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  payment_attempt_id         UUID,
  source                     TEXT NOT NULL
                             CHECK (source IN ('webhook','status_poll','manual_reconciliation','snap_session_cancel_api','cancel_api','expire_api','refund_api')),
  provider_status            TEXT,
  fraud_status               TEXT,
  payment_type               TEXT,
  currency                   TEXT,
  merchant_id                TEXT,
  status_code                TEXT,
  gross_amount_idr           BIGINT CHECK (gross_amount_idr IS NULL OR gross_amount_idr >= 0),
  provider_transaction_id    TEXT,
  provider_transaction_time  TIMESTAMPTZ,
  provider_settlement_time   TIMESTAMPTZ,
  event_fingerprint          TEXT NOT NULL UNIQUE,
  payload_hash               TEXT NOT NULL,
  applied_at                 TIMESTAMPTZ,
  ignored_reason             TEXT,
  received_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (payment_attempt_id, transaction_id)
    REFERENCES payment_attempts(id, transaction_id),
  CHECK (NOT (applied_at IS NOT NULL AND ignored_reason IS NOT NULL))
);

CREATE INDEX idx_payment_provider_events_transaction_received
  ON payment_provider_events(transaction_id, received_at DESC);
CREATE INDEX idx_payment_provider_events_attempt
  ON payment_provider_events(payment_attempt_id, transaction_id, received_at DESC)
  WHERE payment_attempt_id IS NOT NULL;

-- ============================================================
-- 4. Triggers: immutable commercial facts
-- ============================================================
CREATE OR REPLACE FUNCTION private.guard_transaction_commercial_facts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF ROW(
       NEW.transaction_type, NEW.from_tier_id, NEW.to_tier_id,
       NEW.draft_extension_product_id, NEW.amount_idr, NEW.currency,
       NEW.pricing_snapshot, NEW.entitlement_snapshot,
       NEW.payment_provider, NEW.client_request_id, NEW.idempotency_fingerprint
     ) IS DISTINCT FROM ROW(
       OLD.transaction_type, OLD.from_tier_id, OLD.to_tier_id,
       OLD.draft_extension_product_id, OLD.amount_idr, OLD.currency,
       OLD.pricing_snapshot, OLD.entitlement_snapshot,
       OLD.payment_provider, OLD.client_request_id, OLD.idempotency_fingerprint
     )
  THEN
    RAISE EXCEPTION 'commercial transaction facts are immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_transaction_commercial_facts
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION private.guard_transaction_commercial_facts();

CREATE OR REPLACE FUNCTION private.assert_transaction_subject_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.invitation_id IS NOT NULL AND NEW.user_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.invitations i
       WHERE i.id = NEW.invitation_id AND i.user_id = NEW.user_id
     )
  THEN
    RAISE EXCEPTION 'transaction user_id does not own invitation_id';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transaction_subject_consistency
BEFORE INSERT OR UPDATE OF user_id, invitation_id ON transactions
FOR EACH ROW EXECUTE FUNCTION private.assert_transaction_subject_consistency();

CREATE OR REPLACE FUNCTION private.guard_payment_provider_event_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF ROW(
       NEW.transaction_id, NEW.payment_attempt_id, NEW.source,
       NEW.provider_status, NEW.fraud_status, NEW.payment_type, NEW.currency,
       NEW.merchant_id, NEW.status_code, NEW.gross_amount_idr,
       NEW.provider_transaction_id, NEW.provider_transaction_time,
       NEW.provider_settlement_time, NEW.event_fingerprint,
       NEW.payload_hash, NEW.received_at
     ) IS DISTINCT FROM ROW(
       OLD.transaction_id, OLD.payment_attempt_id, OLD.source,
       OLD.provider_status, OLD.fraud_status, OLD.payment_type, OLD.currency,
       OLD.merchant_id, OLD.status_code, OLD.gross_amount_idr,
       OLD.provider_transaction_id, OLD.provider_transaction_time,
       OLD.provider_settlement_time, OLD.event_fingerprint,
       OLD.payload_hash, OLD.received_at
     )
     OR (OLD.applied_at IS NOT NULL AND NEW.applied_at IS DISTINCT FROM OLD.applied_at)
     OR (OLD.ignored_reason IS NOT NULL AND NEW.ignored_reason IS DISTINCT FROM OLD.ignored_reason)
  THEN
    RAISE EXCEPTION 'provider event facts/processed annotation are immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_payment_provider_event_update
BEFORE UPDATE ON payment_provider_events
FOR EACH ROW EXECUTE FUNCTION private.guard_payment_provider_event_update();

-- ============================================================
-- 5. RLS
-- ============================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_provider_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

-- No INSERT/UPDATE/DELETE policies for browser roles; mutations via service_role only
