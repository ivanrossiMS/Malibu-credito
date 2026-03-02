-- Migration: Add extra Asaas fields to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS asaas_wallet_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS asaas_environment TEXT DEFAULT 'sandbox'; -- sandbox, production

-- Cleanup: Ensure no company except Malibu Default has residual Asaas keys from tests
-- This forces the user to configure each one manually as requested.
UPDATE companies 
SET asaas_api_key = NULL, 
    pix_key = NULL, 
    asaas_wallet_id = NULL
WHERE slug != 'malibu-default';
