-- Add currency support to invoices, profiles, and invoice_templates

-- Add currency to invoices (default EUR for existing invoices)
ALTER TABLE invoices ADD COLUMN currency TEXT DEFAULT 'EUR';

-- Add default_currency to profiles
ALTER TABLE profiles ADD COLUMN default_currency TEXT DEFAULT 'EUR';

-- Add default_currency to invoice_templates
ALTER TABLE invoice_templates ADD COLUMN default_currency TEXT DEFAULT 'EUR';

