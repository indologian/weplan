-- Extracted from remaining_tables.sql to fix FK dependency in payment_tables.sql
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

ALTER TABLE draft_extension_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active draft extension products"
  ON draft_extension_products FOR SELECT TO anon, authenticated
  USING (is_active = true);
