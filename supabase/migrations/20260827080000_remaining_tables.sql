-- Migration: Add remaining tables from File 01 §4.7–§4.17
-- Forward-only. Tables that code already references but migrations didn't create.

-- §4.7 Security Audit Purge Requests
CREATE TABLE IF NOT EXISTS security_audit_purge_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type   TEXT NOT NULL CHECK (request_type = 'emergency_protected'),
  requested_by   UUID NOT NULL,
  approved_by    UUID,
  target_spec    JSONB NOT NULL CHECK (jsonb_typeof(target_spec) = 'object'),
  reason_code    TEXT NOT NULL,
  reason_note    TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected','cancelled','executed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at    TIMESTAMPTZ,
  executed_at    TIMESTAMPTZ,
  CHECK (approved_by IS NULL OR approved_by <> requested_by),
  CHECK (status NOT IN ('approved','executed') OR approved_by IS NOT NULL),
  CHECK (
    (status = 'pending' AND resolved_at IS NULL AND executed_at IS NULL)
    OR (status IN ('approved','rejected','cancelled') AND resolved_at IS NOT NULL AND executed_at IS NULL)
    OR (status = 'executed' AND resolved_at IS NOT NULL AND executed_at IS NOT NULL)
  )
);

-- §4.8 Security Incidents
CREATE TABLE IF NOT EXISTS security_incidents (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_key       TEXT NOT NULL,
  invitation_id      UUID REFERENCES invitations(id) ON DELETE CASCADE,
  incident_type      TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open','resolved')),
  started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_suspicious_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at        TIMESTAMPTZ,
  counters           JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(counters) = 'object'),
  alert_sent_at      TIMESTAMPTZ,
  recovery_sent_at   TIMESTAMPTZ,
  CHECK (last_suspicious_at >= started_at),
  CHECK (
    (status = 'open' AND resolved_at IS NULL)
    OR (status = 'resolved' AND resolved_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_security_incident_open_key
  ON security_incidents(incident_key) WHERE status = 'open';

-- §4.9 Admin Support Access
CREATE TABLE IF NOT EXISTS admin_support_access (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  invitation_id   UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  auth_session_id UUID NOT NULL,
  access_level    TEXT NOT NULL DEFAULT 'read'
                  CHECK (access_level IN ('read','write')),
  role_at_grant   TEXT NOT NULL CHECK (role_at_grant IN ('admin','super_admin')),
  auth_context_version_at_grant INT NOT NULL CHECK (auth_context_version_at_grant > 0),
  reason_code     TEXT NOT NULL,
  reason_note     TEXT,
  scopes          TEXT[] NOT NULL CHECK (cardinality(scopes) > 0),
  granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expires_at > granted_at),
  CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);

-- §4.10 Admin Role Change Requests
CREATE TABLE IF NOT EXISTS admin_role_change_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by     UUID NOT NULL,
  target_user_id   UUID NOT NULL,
  current_role     TEXT NOT NULL CHECK (current_role IN ('user','admin','super_admin')),
  target_role      TEXT NOT NULL CHECK (target_role IN ('user','admin','super_admin')),
  reason_code      TEXT NOT NULL,
  reason_note      TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by      UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ,
  CHECK (current_role <> target_role),
  CHECK (approved_by IS NULL OR approved_by <> requested_by),
  CHECK (approved_by IS NULL OR approved_by <> target_user_id),
  CHECK (
    (status = 'pending' AND resolved_at IS NULL)
    OR (status <> 'pending' AND resolved_at IS NOT NULL)
  )
);

-- §4.11 Draft Extension Products
CREATE TABLE IF NOT EXISTS draft_extension_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE CHECK (code IN ('draft_90d','draft_180d','draft_365d')),
  name          TEXT NOT NULL,
  duration_days INT NOT NULL,
  price_amount  INT NOT NULL CHECK (price_amount > 0),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (code = 'draft_90d'  AND duration_days = 90) OR
    (code = 'draft_180d' AND duration_days = 180) OR
    (code = 'draft_365d' AND duration_days = 365)
  )
);

-- §4.13 Leads
CREATE TABLE IF NOT EXISTS leads (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                  TEXT NOT NULL,
  normalized_email       TEXT NOT NULL,
  phone                  TEXT,
  source                 TEXT NOT NULL DEFAULT 'lead_magnet',
  privacy_notice_version TEXT NOT NULL,
  consent_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_leads_normalized_email ON leads(normalized_email);

-- §4.14 Global Settings
CREATE TABLE IF NOT EXISTS global_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- §4.15 Media Tables
CREATE TABLE IF NOT EXISTS media_assets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id         UUID NOT NULL,
  owner_id              UUID NOT NULL,
  kind                  TEXT NOT NULL CHECK (kind IN ('image','audio','video')),
  purpose               TEXT NOT NULL
                        CHECK (purpose IN ('couple_portrait','story_image','gallery','background_audio','qris_image','future_uploaded_video')),
  status                TEXT NOT NULL DEFAULT 'pending_upload'
                        CHECK (status IN ('pending_upload','uploaded','processing','ready','rejected','deleting','deleted')),
  version               INT NOT NULL DEFAULT 1 CHECK (version > 0),
  original_filename     TEXT,
  declared_mime         TEXT,
  detected_mime         TEXT,
  quarantine_path       TEXT,
  final_path            TEXT,
  poster_path           TEXT,
  byte_size             BIGINT CHECK (byte_size IS NULL OR byte_size >= 0),
  width                 INT CHECK (width IS NULL OR width > 0),
  height                INT CHECK (height IS NULL OR height > 0),
  focus_x               NUMERIC(5,4) NOT NULL DEFAULT 0.5 CHECK (focus_x BETWEEN 0 AND 1),
  focus_y               NUMERIC(5,4) NOT NULL DEFAULT 0.5 CHECK (focus_y BETWEEN 0 AND 1),
  duration_seconds      NUMERIC CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  processing_started_at TIMESTAMPTZ,
  failure_code          TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id, invitation_id),
  FOREIGN KEY (invitation_id, owner_id)
    REFERENCES invitations(id, user_id) ON DELETE CASCADE,
  CHECK (
    (kind = 'image' AND purpose IN ('couple_portrait','story_image','gallery','qris_image'))
    OR (kind = 'audio' AND purpose = 'background_audio')
    OR (kind = 'video' AND purpose = 'future_uploaded_video')
  )
);

CREATE TABLE IF NOT EXISTS invitation_gallery_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id   UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  media_asset_id  UUID NOT NULL,
  position        SMALLINT NOT NULL CHECK (position >= 0),
  caption         TEXT CHECK (char_length(caption) <= 300),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (invitation_id, position),
  UNIQUE (invitation_id, media_asset_id),
  FOREIGN KEY (media_asset_id, invitation_id)
    REFERENCES media_assets(id, invitation_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS upload_reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id   UUID NOT NULL,
  owner_id        UUID NOT NULL,
  kind            TEXT NOT NULL CHECK (kind IN ('image','audio','video')),
  purpose         TEXT NOT NULL
                  CHECK (purpose IN ('couple_portrait','story_image','gallery','background_audio','qris_image','future_uploaded_video')),
  reserved_count  INT NOT NULL DEFAULT 1 CHECK (reserved_count > 0),
  reserved_bytes  BIGINT NOT NULL DEFAULT 0 CHECK (reserved_bytes >= 0),
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','consumed','released','expired')),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (invitation_id, owner_id)
    REFERENCES invitations(id, user_id) ON DELETE CASCADE,
  CHECK (expires_at > created_at),
  CHECK (
    (kind = 'image' AND purpose IN ('couple_portrait','story_image','gallery','qris_image'))
    OR (kind = 'audio' AND purpose = 'background_audio')
    OR (kind = 'video' AND purpose = 'future_uploaded_video')
  )
);

-- §4.16 Reliability Tables
CREATE TABLE IF NOT EXISTS outbox_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type        TEXT NOT NULL,
  aggregate_type    TEXT NOT NULL,
  aggregate_id      UUID,
  payload_version   INT NOT NULL DEFAULT 1 CHECK (payload_version > 0),
  payload            JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','dispatching','dispatched','failed')),
  attempts           INT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at          TIMESTAMPTZ,
  lock_token         UUID,
  dispatched_at      TIMESTAMPTZ,
  last_error_code    TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (status = 'dispatching' AND locked_at IS NOT NULL AND lock_token IS NOT NULL)
    OR (status <> 'dispatching' AND locked_at IS NULL AND lock_token IS NULL)
  ),
  CHECK (
    (status = 'dispatched' AND dispatched_at IS NOT NULL)
    OR (status <> 'dispatched' AND dispatched_at IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS failed_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type          TEXT NOT NULL,
  resource_id       UUID,
  idempotency_key   TEXT NOT NULL UNIQUE,
  attempt_count     INT NOT NULL CHECK (attempt_count > 0),
  error_code        TEXT,
  error_summary     TEXT,
  first_failed_at   TIMESTAMPTZ NOT NULL,
  last_failed_at    TIMESTAMPTZ NOT NULL,
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (last_failed_at >= first_failed_at)
);

CREATE TABLE IF NOT EXISTS scheduled_job_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name          TEXT NOT NULL,
  started_at        TIMESTAMPTZ NOT NULL,
  completed_at      TIMESTAMPTZ,
  status             TEXT NOT NULL CHECK (status IN ('running','succeeded','failed')),
  processed_count   INT NOT NULL DEFAULT 0 CHECK (processed_count >= 0),
  failed_count      INT NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  error_summary     TEXT,
  CHECK (
    (status = 'running' AND completed_at IS NULL)
    OR (status IN ('succeeded','failed') AND completed_at IS NOT NULL)
  ),
  CHECK (completed_at IS NULL OR completed_at >= started_at)
);

-- §4.17 Data Portability, Email, Payment Adjustment & Analytics
CREATE TABLE IF NOT EXISTS data_exports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_id       UUID REFERENCES invitations(id) ON DELETE CASCADE,
  scope               TEXT NOT NULL CHECK (scope IN ('invitation','account','admin_bulk')),
  request_idempotency_key TEXT NOT NULL UNIQUE,
  request_fingerprint TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued','processing','ready','failed','expired','deleted')),
  object_path         TEXT,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  CHECK (
    (scope = 'invitation' AND invitation_id IS NOT NULL)
    OR (scope IN ('account','admin_bulk') AND invitation_id IS NULL)
  ),
  CHECK (status <> 'ready' OR (object_path IS NOT NULL AND expires_at IS NOT NULL AND completed_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS data_deletion_tombstones (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_user_id       UUID NOT NULL,
  deletion_completed_at TIMESTAMPTZ NOT NULL,
  purge_after           TIMESTAMPTZ NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (purge_after > deletion_completed_at)
);

CREATE TABLE IF NOT EXISTS email_deliveries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invitation_id       UUID REFERENCES invitations(id) ON DELETE SET NULL,
  template_code       TEXT NOT NULL,
  template_version    INT NOT NULL CHECK (template_version > 0),
  idempotency_key     TEXT NOT NULL UNIQUE,
  provider_message_id TEXT,
  status              TEXT NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued','sending','sent','delivered','failed','bounced','complained')),
  sent_at             TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  failed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (status NOT IN ('sent','delivered','bounced','complained') OR sent_at IS NOT NULL),
  CHECK (status <> 'delivered' OR delivered_at IS NOT NULL),
  CHECK (status <> 'failed' OR failed_at IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS payment_adjustments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id        UUID NOT NULL REFERENCES transactions(id),
  payment_attempt_id    UUID,
  adjustment_type       TEXT NOT NULL CHECK (adjustment_type IN (
                           'refund','partial_refund','chargeback','partial_chargeback',
                           'chargeback_reversal','provider_reversal','manual_external_refund'
                         )),
  amount_idr            BIGINT NOT NULL CHECK (amount_idr > 0),
  refund_key            TEXT,
  provider_reference    TEXT,
  provider_status       TEXT,
  status                TEXT NOT NULL CHECK (status IN (
                           'requested','provider_approved','bank_confirmed','confirmed',
                           'failed','requires_manual_review','reversed'
                         )),
  reason_code           TEXT,
  reason_note           TEXT,
  requested_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider_approved_at  TIMESTAMPTZ,
  bank_confirmed_at     TIMESTAMPTZ,
  confirmed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (payment_attempt_id, transaction_id)
    REFERENCES payment_attempts(id, transaction_id),
  CHECK (
    adjustment_type NOT IN ('refund','partial_refund') OR refund_key IS NOT NULL
  ),
  CHECK (status <> 'provider_approved' OR provider_approved_at IS NOT NULL),
  CHECK (status <> 'bank_confirmed' OR bank_confirmed_at IS NOT NULL),
  CHECK (status <> 'confirmed' OR confirmed_at IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS invitation_analytics_daily (
  invitation_id     UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  date              DATE NOT NULL,
  views             BIGINT NOT NULL DEFAULT 0 CHECK (views >= 0),
  rsvp_submissions  BIGINT NOT NULL DEFAULT 0 CHECK (rsvp_submissions >= 0),
  PRIMARY KEY (invitation_id, date)
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_security_incident_invitation
  ON security_incidents(invitation_id, last_suspicious_at DESC) WHERE invitation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_access_active
  ON admin_support_access(admin_user_id, invitation_id, auth_session_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_support_access_invitation_active
  ON admin_support_access(invitation_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_admin_role_change_target_created
  ON admin_role_change_requests(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_role_change_requester_created
  ON admin_role_change_requests(requested_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_purge_requested_by_created
  ON security_audit_purge_requests(requested_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_invitation_owner_status
  ON media_assets(invitation_id, owner_id, status, kind, purpose);
CREATE INDEX IF NOT EXISTS idx_media_assets_owner_updated
  ON media_assets(owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_media_invitation
  ON invitation_gallery_items(media_asset_id, invitation_id);
CREATE INDEX IF NOT EXISTS idx_upload_reservation_active
  ON upload_reservations(invitation_id, owner_id, kind, purpose, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_upload_reservation_owner_active
  ON upload_reservations(owner_id, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_outbox_due
  ON outbox_events(available_at, id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_outbox_dispatch_lease
  ON outbox_events(locked_at, id) WHERE status = 'dispatching';
CREATE INDEX IF NOT EXISTS idx_scheduled_runs_job_started
  ON scheduled_job_runs(job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_exports_user_created
  ON data_exports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_delivery_user_created
  ON email_deliveries(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_delivery_invitation_created
  ON email_deliveries(invitation_id, created_at DESC) WHERE invitation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_delivery_pending
  ON email_deliveries(created_at, id) WHERE status IN ('queued','sending');
CREATE INDEX IF NOT EXISTS idx_payment_adjustment_transaction_created
  ON payment_adjustments(transaction_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_data_export_object_path
  ON data_exports(object_path) WHERE object_path IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_adjustment_refund_key
  ON payment_adjustments(refund_key) WHERE refund_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_media_quarantine_path
  ON media_assets(quarantine_path) WHERE quarantine_path IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_media_final_path
  ON media_assets(final_path) WHERE final_path IS NOT NULL;

-- RLS for all new tables
ALTER TABLE security_audit_purge_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_support_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_role_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_extension_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_tombstones ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_analytics_daily ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active draft extension products"
  ON draft_extension_products FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Anyone can view public global settings"
  ON global_settings FOR SELECT TO anon, authenticated
  USING (key IN ('homepage_sections','maintenance_mode'));

CREATE POLICY "Users can view own media metadata"
  ON media_assets FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = owner_id);

CREATE POLICY "Owners can view own gallery ordering"
  ON invitation_gallery_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invitations i
      WHERE i.id = invitation_gallery_items.invitation_id
        AND i.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can view own export jobs"
  ON data_exports FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE POLICY "Owners can view own daily analytics"
  ON invitation_analytics_daily FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invitations i
      WHERE i.id = invitation_analytics_daily.invitation_id
        AND i.user_id = (SELECT auth.uid())
    )
  );

-- GRANT for existing tables that were missing SELECT grants
GRANT SELECT ON guests TO authenticated;
GRANT SELECT ON transactions TO authenticated;
