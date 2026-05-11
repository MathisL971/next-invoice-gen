-- Add legal_info JSONB column to profiles table
-- This stores company legal information like SIRET, SIREN, RCS, etc.
ALTER TABLE profiles ADD COLUMN legal_info JSONB DEFAULT '{}'::jsonb;

-- Example structure of legal_info:
-- {
--   "company_type": "Micro-Entreprise",
--   "siret": "978 934 560 00019",
--   "siren": "978 934 560",
--   "rcs": "Basse-Terre",
--   "ape_naf": "6201Z",
--   "tva_number": "FR 70 978 934 560",
--   "service_type": "Prestation de service",
--   "late_payment_notice": "En cas de retard de paiement, une indemnité forfaitaire pour frais de recouvrement de 40 euros sera exigée (Décret n°2012-1115 du 2 octobre 2012)."
-- }

