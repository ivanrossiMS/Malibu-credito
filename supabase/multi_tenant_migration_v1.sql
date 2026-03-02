-- Migration: Multi-Tenant Expansion (Phase 1)
-- This script prepares the database for multiple companies.

-- 1. Create the companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    cnpj TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'ativo', -- ativo, bloqueado
    asaas_api_key TEXT,
    pix_key TEXT,
    webhook_secret TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add company_id to all relevant tables
-- We use BIGINT or INT depending on the table's existing patterns, 
-- but SERIAL uses INT usually. Let's use INT for consistency with companies(id).

ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id);
ALTER TABLE installments ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id);
ALTER TABLE loan_requests ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id);
ALTER TABLE billing_installments ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id);

-- 3. Data Migration (Seed Initial Company)
-- We create one default company and link all existing data to it to avoid breaking the system.

DO $$
DECLARE
    default_company_id INT;
BEGIN
    -- Only insert if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM companies WHERE slug = 'malibu-default') THEN
        INSERT INTO companies (name, slug, status) 
        VALUES ('Malibu Crédito (Padrão)', 'malibu-default', 'ativo')
        RETURNING id INTO default_company_id;
    ELSE
        SELECT id INTO default_company_id FROM companies WHERE slug = 'malibu-default';
    END IF;

    -- Update existing records to point to this company
    UPDATE users SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE clients SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE loans SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE installments SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE payments SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE loan_requests SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE billing_installments SET company_id = default_company_id WHERE company_id IS NULL;

END $$;

-- 4. Set company_id to NOT NULL (Optional, but recommended for integrity after migration)
-- For now we keep it nullable to avoid any immediate insert errors while JS is being updated.
