-- Track fixed annual territorial obligations (CFAE, TED, etc.)
CREATE TABLE IF NOT EXISTS annual_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  obligation_type TEXT NOT NULL,
  amount_due NUMERIC(12, 2) NOT NULL,
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, obligation_type)
);

ALTER TABLE annual_obligations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own annual obligations"
  ON annual_obligations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own annual obligations"
  ON annual_obligations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annual obligations"
  ON annual_obligations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own annual obligations"
  ON annual_obligations FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_annual_obligations_user_year
  ON annual_obligations (user_id, year);
