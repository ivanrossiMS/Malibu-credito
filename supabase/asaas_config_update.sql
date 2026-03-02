-- Migration: Add extra Asaas fields to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS asaas_wallet_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS asaas_environment TEXT DEFAULT 'sandbox'; -- sandbox, production
