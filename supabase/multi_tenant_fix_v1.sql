-- Fix: Add missing company_id columns to remaining tables
-- This script ensures all system tables respect the multi-tenant architecture.

-- 1. Add company_id to tables that were missed
ALTER TABLE templates ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id);
ALTER TABLE pix_charges ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id);

-- 2. Data Migration for missed tables
DO $$
DECLARE
    default_company_id INT;
BEGIN
    SELECT id INTO default_company_id FROM companies WHERE slug = 'malibu-default';
    
    IF default_company_id IS NOT NULL THEN
        UPDATE templates SET company_id = default_company_id WHERE company_id IS NULL;
        UPDATE pix_charges SET company_id = default_company_id WHERE company_id IS NULL;
        UPDATE webhook_events SET company_id = default_company_id WHERE company_id IS NULL;
    END IF;
END $$;
