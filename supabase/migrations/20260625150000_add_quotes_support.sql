-- Quotes (devis) share the invoices table with document_type = 'quote'
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS document_type TEXT NOT NULL DEFAULT 'invoice',
  ADD COLUMN IF NOT EXISTS converted_to_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_quote_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'accepted', 'declined'));

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_document_type_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_document_type_check
  CHECK (document_type IN ('invoice', 'quote'));

CREATE INDEX IF NOT EXISTS idx_invoices_document_type ON invoices (user_id, document_type);

-- Invoice references only count invoice documents
CREATE OR REPLACE FUNCTION generate_invoice_reference(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  ref TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'F-(\d+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM invoices
  WHERE user_id = p_user_id
    AND document_type = 'invoice';

  ref := 'F-' || LPAD(next_num::TEXT, 6, '0');
  RETURN ref;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_quote_reference(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  ref TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'D-(\d+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM invoices
  WHERE user_id = p_user_id
    AND document_type = 'quote';

  ref := 'D-' || LPAD(next_num::TEXT, 6, '0');
  RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Free tier quota applies to invoices only, not quotes
CREATE OR REPLACE FUNCTION enforce_invoice_quota()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE n INT;
BEGIN
  IF NEW.document_type IS DISTINCT FROM 'invoice' THEN RETURN NEW; END IF;
  IF current_plan(NEW.user_id) = 'pro' THEN RETURN NEW; END IF;
  SELECT count(*) INTO n FROM invoices
    WHERE user_id = NEW.user_id
      AND document_type = 'invoice'
      AND date_trunc('month', created_at) = date_trunc('month', NOW());
  IF n >= 3 THEN
    RAISE EXCEPTION 'quota_exceeded_invoices' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
