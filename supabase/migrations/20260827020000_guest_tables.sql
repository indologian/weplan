-- M5: Guest tables, credentials, and RLS

-- ============================================================
-- 1. guests
-- ============================================================
CREATE TABLE guests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id         UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 160),
  phone                 TEXT,
  normalized_phone      TEXT,
  title                 TEXT,
  group_name            TEXT,
  notes                 TEXT,
  guest_source          TEXT NOT NULL DEFAULT 'manual'
                        CHECK (guest_source IN ('manual', 'import', 'public_rsvp')),

  rsvp_status           TEXT NOT NULL DEFAULT 'pending'
                        CHECK (rsvp_status IN ('pending', 'confirmed', 'declined')),
  attendance            INT NOT NULL DEFAULT 1,
  wish_message          TEXT CHECK (char_length(wish_message) <= 500),
  wish_status           TEXT NOT NULL DEFAULT 'pending'
                        CHECK (wish_status IN ('pending', 'approved', 'hidden', 'rejected')),

  is_wa_sent            BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (rsvp_status = 'declined' AND attendance = 0)
    OR (rsvp_status IN ('pending','confirmed') AND attendance BETWEEN 1 AND 10)
  )
);

CREATE TABLE guest_credentials (
  guest_id               UUID PRIMARY KEY REFERENCES guests(id) ON DELETE CASCADE,
  access_token_hash      TEXT UNIQUE,
  token_created_at       TIMESTAMPTZ,
  rsvp_edit_token_hash   TEXT UNIQUE,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (access_token_hash IS NOT NULL OR rsvp_edit_token_hash IS NOT NULL)
);

CREATE INDEX idx_guests_invitation_id ON guests(invitation_id);
CREATE INDEX idx_guests_rsvp ON guests(invitation_id, rsvp_status);
CREATE UNIQUE INDEX uq_guests_invitation_phone
  ON guests(invitation_id, normalized_phone)
  WHERE normalized_phone IS NOT NULL;

-- ============================================================
-- 2. RLS
-- ============================================================
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own guests"
ON guests FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invitations i
    WHERE i.id = guests.invitation_id
      AND i.user_id = (SELECT auth.uid())
  )
);

-- No anon/authenticated INSERT/UPDATE/DELETE; mutations via service_role only
-- No SELECT on guest_credentials for browser roles
