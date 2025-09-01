-- ============================================
-- Migration: Associate Candidates with Departments and Add Payment Categories
-- ============================================
-- This migration properly associates candidates with departments
-- by converting the department string field to a department_id foreign key
-- and adds payment category to departments for school fee determination

BEGIN;

-- Add payment category column to departments table for school fee determination
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS payment_category VARCHAR(50);

-- Create index on the payment category column
CREATE INDEX IF NOT EXISTS idx_departments_payment_category ON departments(payment_category);

-- Add constraint to ensure valid payment categories
ALTER TABLE departments 
ADD CONSTRAINT chk_departments_payment_category 
CHECK (payment_category IN (
    'SCIENCES', 'ARTS', 'LANGUAGES', 'SOCIAL SCIENCES', 'EDUCATION', 
    'SPECIAL EDUCATION', 'PRIMARY EDUCATION', 'SECONDARY EDUCATION', 
    'VOCATIONAL EDUCATION', 'ENVIRONMENTAL SCIENCES', 'MANAGEMENT', 
    'HEALTH', 'ENGINEERING', 'BUSINESS', 'OTHER'
));

-- Update existing departments with default payment categories based on faculty
-- This mapping can be customized based on your specific requirements
UPDATE departments 
SET payment_category = CASE 
    WHEN faculty_id = (SELECT id FROM faculties WHERE code = 'ENG') THEN 'ENGINEERING'
    WHEN faculty_id = (SELECT id FROM faculties WHERE code = 'SCI') THEN 'SCIENCES'
    WHEN faculty_id = (SELECT id FROM faculties WHERE code = 'MGT') THEN 'BUSINESS'
    WHEN faculty_id = (SELECT id FROM faculties WHERE code = 'SOC') THEN 'SOCIAL SCIENCES'
    ELSE 'OTHER'
END
WHERE payment_category IS NULL;

-- Add comment to document the payment category column
COMMENT ON COLUMN departments.payment_category IS 'Payment category for school fee determination. Used to determine the correct school fee amount for students in this department.';

-- First, let's see what departments currently exist in the candidates table
-- and map them to actual department IDs
DO $$ 
DECLARE
    dept_record RECORD;
    dept_id UUID;
    candidate_count INTEGER;
BEGIN
    -- Create a temporary mapping table for existing department names
    CREATE TEMP TABLE dept_mapping AS
    SELECT DISTINCT department 
    FROM candidates 
    WHERE department IS NOT NULL AND department != '';
    
    -- Log the mapping process
    RAISE NOTICE 'Found % distinct department names in candidates table', (SELECT COUNT(*) FROM dept_mapping);
    
    -- For each department name, try to find a matching department
    FOR dept_record IN SELECT * FROM dept_mapping LOOP
        -- Try to find exact match first
        SELECT id INTO dept_id 
        FROM departments 
        WHERE LOWER(name) = LOWER(dept_record.department) 
        AND is_active = true;
        
        -- If no exact match, try partial match
        IF dept_id IS NULL THEN
            SELECT id INTO dept_id 
            FROM departments 
            WHERE LOWER(name) LIKE '%' || LOWER(dept_record.department) || '%' 
            AND is_active = true;
        END IF;
        
        -- If still no match, try code match
        IF dept_id IS NULL THEN
            SELECT id INTO dept_id 
            FROM departments 
            WHERE LOWER(code) = LOWER(dept_record.department) 
            AND is_active = true;
        END IF;
        
        -- Log the mapping result
        IF dept_id IS NOT NULL THEN
            SELECT COUNT(*) INTO candidate_count 
            FROM candidates 
            WHERE department = dept_record.department;
            
            RAISE NOTICE 'Mapped department "%" to ID % (% candidates)', 
                dept_record.department, dept_id, candidate_count;
        ELSE
            RAISE NOTICE 'WARNING: Could not map department "%" to any existing department', 
                dept_record.department;
        END IF;
    END LOOP;
    
    DROP TABLE dept_mapping;
END $$;

-- Add department_id column to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS department_id UUID;

-- Create index on the new department_id column
CREATE INDEX IF NOT EXISTS idx_candidates_department_id ON candidates(department_id);

-- Update existing candidates to set department_id based on department name
-- This will be done in batches to avoid timeouts
UPDATE candidates 
SET department_id = (
    SELECT d.id 
    FROM departments d 
    WHERE (
        LOWER(d.name) = LOWER(candidates.department) 
        OR LOWER(d.code) = LOWER(candidates.department)
        OR LOWER(d.name) LIKE '%' || LOWER(candidates.department) || '%'
    ) 
    AND d.is_active = true
    LIMIT 1
)
WHERE candidates.department IS NOT NULL 
AND candidates.department != '';

-- Add foreign key constraint
ALTER TABLE candidates 
ADD CONSTRAINT fk_candidates_department_id 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Make department_id NOT NULL after ensuring all candidates have valid department_id
-- First, let's see how many candidates don't have a department_id
DO $$ 
DECLARE
    missing_dept_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_dept_count 
    FROM candidates 
    WHERE department_id IS NULL;
    
    IF missing_dept_count > 0 THEN
        RAISE NOTICE 'WARNING: % candidates still do not have a valid department_id', missing_dept_count;
        RAISE NOTICE 'These candidates will need manual review to assign proper departments';
    ELSE
        RAISE NOTICE 'All candidates have valid department_id - can make column NOT NULL';
        -- Uncomment the following line when all candidates have valid department_id
        -- ALTER TABLE candidates ALTER COLUMN department_id SET NOT NULL;
    END IF;
END $$;

-- Add a check constraint to ensure department_id is provided for new candidates
-- (only if we can make it NOT NULL)
-- ALTER TABLE candidates ADD CONSTRAINT chk_candidates_department_id CHECK (department_id IS NOT NULL);

-- Keep the old department column for now as a backup, but mark it as deprecated
-- We can remove it later after confirming the migration was successful
COMMENT ON COLUMN candidates.department IS 'DEPRECATED: Use department_id instead. This column will be removed in a future migration.';

-- Add a comment to the new column
COMMENT ON COLUMN candidates.department_id IS 'Foreign key reference to the departments table. Represents the candidate''s course of study.';

COMMIT;
