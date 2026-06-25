-- Subscriptions: one row per user, written only by the Stripe webhook (service_role).
CREATE TABLE subscriptions (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active','trialing','past_due','canceled','incomplete','incomplete_expired','unpaid','paused'
  )),
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE policies: only service_role writes (webhook + checkout endpoint via admin client).

-- past_due is treated as still Pro (grace period).
CREATE OR REPLACE FUNCTION current_plan(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (SELECT plan FROM subscriptions
       WHERE user_id = p_user_id
         AND status IN ('active','trialing','past_due')),
    'free'
  );
$$;

-- Free tier: 1 client max.
CREATE OR REPLACE FUNCTION enforce_client_quota()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE n INT;
BEGIN
  IF current_plan(NEW.user_id) = 'pro' THEN RETURN NEW; END IF;
  SELECT count(*) INTO n FROM clients WHERE user_id = NEW.user_id;
  IF n >= 1 THEN
    RAISE EXCEPTION 'quota_exceeded_clients' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER enforce_client_quota_trigger
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION enforce_client_quota();

-- Free tier: 3 invoices per calendar month.
CREATE OR REPLACE FUNCTION enforce_invoice_quota()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE n INT;
BEGIN
  IF current_plan(NEW.user_id) = 'pro' THEN RETURN NEW; END IF;
  SELECT count(*) INTO n FROM invoices
    WHERE user_id = NEW.user_id
      AND date_trunc('month', created_at) = date_trunc('month', NOW());
  IF n >= 3 THEN
    RAISE EXCEPTION 'quota_exceeded_invoices' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER enforce_invoice_quota_trigger
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION enforce_invoice_quota();

-- Webhook idempotency log (Stripe best practice: log processed event IDs).
CREATE TABLE processed_stripe_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE processed_stripe_events ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role accesses this table.
