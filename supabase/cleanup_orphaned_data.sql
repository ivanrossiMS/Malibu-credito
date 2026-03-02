-- Cleanup Script: Remove orphaned data from deleted companies
-- Run this to clean up records that survived previous company deletions

-- 1. Remove billing installments without a valid company
DELETE FROM billing_installments 
WHERE company_id IS NULL 
OR company_id NOT IN (SELECT id FROM companies);

-- 2. Remove users without a valid company (except master if applicable)
DELETE FROM users 
WHERE (company_id IS NULL AND role != 'MASTER')
OR (company_id IS NOT NULL AND company_id NOT IN (SELECT id FROM companies));

-- 3. Remove loans and related data without a valid company
DELETE FROM loans 
WHERE company_id IS NULL 
OR company_id NOT IN (SELECT id FROM companies);

-- 4. Remove clients without a valid company
DELETE FROM clients 
WHERE company_id IS NULL 
OR company_id NOT IN (SELECT id FROM companies);

-- 5. Remove pix_charges without a valid company
DELETE FROM pix_charges 
WHERE company_id IS NULL 
OR company_id NOT IN (SELECT id FROM companies);
