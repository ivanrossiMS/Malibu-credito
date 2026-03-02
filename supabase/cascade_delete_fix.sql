-- Migration: Setup Cascade Delete for Multi-Tenant Architecture
-- This script ensures that deleting a company removes all its children data.

-- Utility function to safely update foreign keys to CASCADE
DO $$
DECLARE
    row RECORD;
BEGIN
    FOR row IN 
        SELECT 
            tc.table_name, 
            kcu.column_name, 
            con.conname AS constraint_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN pg_constraint AS con
              ON con.conname = tc.constraint_name
        WHERE 
            tc.constraint_type = 'FOREIGN KEY' 
            AND kcu.column_name = 'company_id'
            AND tc.table_schema = 'public'
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(row.table_name) || ' DROP CONSTRAINT ' || quote_ident(row.constraint_name);
        EXECUTE 'ALTER TABLE ' || quote_ident(row.table_name) || ' ADD CONSTRAINT ' || quote_ident(row.constraint_name) || 
                ' FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE';
    END LOOP;
END $$;

-- Specifically ensure pix_charges also cascades via installments or company_id
-- If pix_charges doesn't have company_id directly, it should cascade from installment_id
DO $$
DECLARE
    const_name TEXT;
BEGIN
    SELECT conname INTO const_name
    FROM pg_constraint
    WHERE conrelid = 'pix_charges'::regclass AND contype = 'f' AND conname LIKE '%installment%';
    
    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE pix_charges DROP CONSTRAINT ' || quote_ident(const_name);
        EXECUTE 'ALTER TABLE pix_charges ADD CONSTRAINT ' || quote_ident(const_name) || 
                ' FOREIGN KEY (installment_id) REFERENCES installments(id) ON DELETE CASCADE';
    END IF;
END $$;
