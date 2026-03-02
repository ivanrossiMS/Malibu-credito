-- Add access control fields to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS access_override BOOLEAN DEFAULT FALSE;

-- Function to check if a company is in debt
-- Returns true if there are any overdue billing installments
CREATE OR REPLACE FUNCTION is_company_in_debt(target_company_id INT) 
RETURNS BOOLEAN AS $$
DECLARE
    overdue_count INT;
BEGIN
    SELECT COUNT(*) INTO overdue_count
    FROM billing_installments
    WHERE company_id = target_company_id
    AND status = 'VENCIDA'
    AND due_date < CURRENT_DATE;
    
    RETURN overdue_count > 0;
END;
$$ LANGUAGE plpgsql;
