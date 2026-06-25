-- Fiscal settings for micro-entreprise cotisation tracking (St Barth CPS)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fiscal_settings JSONB DEFAULT '{}'::jsonb;

-- Track manual reserve set-aside and CPS payments per declaration period
CREATE TABLE IF NOT EXISTS cotisation_reserves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL,
  amount_set_aside NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, period_key)
);

ALTER TABLE cotisation_reserves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cotisation reserves"
  ON cotisation_reserves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cotisation reserves"
  ON cotisation_reserves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cotisation reserves"
  ON cotisation_reserves FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cotisation reserves"
  ON cotisation_reserves FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cotisation_reserves_user_period
  ON cotisation_reserves (user_id, period_key);
