-- document_type must be set at INSERT time; changing quote -> invoice via UPDATE
-- bypasses the invoice quota trigger (INSERT-only) and the convert API check.
CREATE OR REPLACE FUNCTION prevent_invoice_document_type_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.document_type IS DISTINCT FROM OLD.document_type THEN
    RAISE EXCEPTION 'document_type_immutable' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER prevent_invoice_document_type_change_trigger
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION prevent_invoice_document_type_change();
