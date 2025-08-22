-- ============================================
-- Phase 10.5: Database Schema Alignment Fixes
-- ============================================
-- Fixes issues identified during admin endpoint testing:
-- 1. Fix decision_status enum values
-- 2. Fix column name mismatches
-- 3. Ensure data consistency

-- ---------- Fix 1: Update decision_status enum ----------

-- First, let's check if there are any invalid enum values in the database
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    -- Check for any admissions with invalid decision values
    SELECT COUNT(*) INTO invalid_count 
    FROM admissions 
    WHERE decision NOT IN ('pending', 'admitted', 'rejected');
    
    IF invalid_count > 0 THEN
        RAISE NOTICE 'Found % admissions with invalid decision values. Cleaning up...', invalid_count;
        
        -- Update any invalid values to 'pending'
        UPDATE admissions 
        SET decision = 'pending' 
        WHERE decision NOT IN ('pending', 'admitted', 'rejected');
    END IF;
END $$;

-- ---------- Fix 2: Add missing columns to candidates table ----------

-- Add program choice columns to candidates table if they don't exist
DO $$
BEGIN
    -- Add program_choice_1 column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'candidates' AND column_name = 'program_choice_1') THEN
        ALTER TABLE candidates ADD COLUMN program_choice_1 varchar(32);
        RAISE NOTICE 'Added program_choice_1 column to candidates table';
    END IF;
    
    -- Add program_choice_2 column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'candidates' AND column_name = 'program_choice_2') THEN
        ALTER TABLE candidates ADD COLUMN program_choice_2 varchar(32);
        RAISE NOTICE 'Added program_choice_2 column to candidates table';
    END IF;
    
    -- Add program_choice_3 column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'candidates' AND column_name = 'program_choice_3') THEN
        ALTER TABLE candidates ADD COLUMN program_choice_3 varchar(32);
        RAISE NOTICE 'Added program_choice_3 column to candidates table';
    END IF;
    
    -- Add jamb_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'candidates' AND column_name = 'jamb_score') THEN
        ALTER TABLE candidates ADD COLUMN jamb_score integer;
        RAISE NOTICE 'Added jamb_score column to candidates table';
    END IF;
    
    -- Add state_of_origin column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'candidates' AND column_name = 'state_of_origin') THEN
        ALTER TABLE candidates ADD COLUMN state_of_origin varchar(64);
        RAISE NOTICE 'Added state_of_origin column to candidates table';
    END IF;
    
    -- Add application_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'candidates' AND column_name = 'application_status') THEN
        ALTER TABLE candidates ADD COLUMN application_status varchar(32) DEFAULT 'pending';
        RAISE NOTICE 'Added application_status column to candidates table';
    END IF;
    
    -- Add payment_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'candidates' AND column_name = 'payment_status') THEN
        ALTER TABLE candidates ADD COLUMN payment_status varchar(32) DEFAULT 'pending';
        RAISE NOTICE 'Added payment_status column to candidates table';
    END IF;
    
    -- Add admission_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'candidates' AND column_name = 'admission_status') THEN
        ALTER TABLE candidates ADD COLUMN admission_status varchar(32) DEFAULT 'pending';
        RAISE NOTICE 'Added admission_status column to candidates table';
    END IF;
END $$;

-- ---------- Fix 3: Populate program choices from applications table ----------

-- Update candidates with program choices from their applications
UPDATE candidates 
SET 
    program_choice_1 = applications.programme_code,
    application_status = applications.status
FROM applications 
WHERE candidates.id = applications.candidate_id 
  AND applications.session = '2024/2025'  -- Update for current session
  AND candidates.program_choice_1 IS NULL;

-- ---------- Fix 4: Populate JAMB scores from prelist ----------

-- Update candidates with JAMB scores from prelist
UPDATE candidates 
SET jamb_score = jamb_prelist.utme_score
FROM jamb_prelist 
WHERE candidates.jamb_reg_no = jamb_prelist.jamb_reg_no 
  AND candidates.jamb_score IS NULL;

-- ---------- Fix 5: Populate state of origin from prelist ----------

-- Update candidates with state of origin from prelist
UPDATE candidates 
SET state_of_origin = jamb_prelist.state_of_origin
FROM jamb_prelist 
WHERE candidates.jamb_reg_no = jamb_prelist.jamb_reg_no 
  AND candidates.state_of_origin IS NULL;

-- ---------- Fix 6: Update payment status based on actual payments ----------

-- Update candidates with payment status based on their latest payment
UPDATE candidates 
SET payment_status = CASE 
    WHEN latest_payment.status = 'success' THEN 'paid'
    WHEN latest_payment.status = 'pending' THEN 'pending'
    WHEN latest_payment.status = 'failed' THEN 'failed'
    ELSE 'pending'
END
FROM (
    SELECT DISTINCT ON (candidate_id) 
           candidate_id, 
           status
    FROM payments 
    ORDER BY candidate_id, created_at DESC
) AS latest_payment
WHERE candidates.id = latest_payment.candidate_id;

-- ---------- Fix 7: Update admission status based on admissions table ----------

-- Update candidates with admission status based on admissions decisions
UPDATE candidates 
SET admission_status = CASE 
    WHEN admissions.decision = 'admitted' THEN 'admitted'
    WHEN admissions.decision = 'rejected' THEN 'rejected'
    ELSE 'pending'
END
FROM admissions 
WHERE candidates.id = admissions.candidate_id;

-- ---------- Fix 8: Create indexes for better performance ----------

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_candidates_program_choice_1 ON candidates(program_choice_1);
CREATE INDEX IF NOT EXISTS idx_candidates_jamb_score ON candidates(jamb_score);
CREATE INDEX IF NOT EXISTS idx_candidates_state_of_origin ON candidates(state_of_origin);
CREATE INDEX IF NOT EXISTS idx_candidates_application_status ON candidates(application_status);
CREATE INDEX IF NOT EXISTS idx_candidates_payment_status ON candidates(payment_status);
CREATE INDEX IF NOT EXISTS idx_candidates_admission_status ON candidates(admission_status);

-- ---------- Fix 9: Ensure enum constraints are properly enforced ----------

-- Add check constraints to ensure data integrity
ALTER TABLE candidates 
ADD CONSTRAINT chk_candidates_application_status 
CHECK (application_status IN ('pending', 'submitted', 'approved', 'rejected'));

ALTER TABLE candidates 
ADD CONSTRAINT chk_candidates_payment_status 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

ALTER TABLE candidates 
ADD CONSTRAINT chk_candidates_admission_status 
CHECK (admission_status IN ('pending', 'provisionally_admitted', 'fully_admitted', 'rejected', 'waitlisted', 'under_review'));

-- ---------- Fix 10: Update the dashboard view to use correct column names ----------

-- Drop the old view if it exists
DROP VIEW IF EXISTS v_dashboard_summary;

-- Recreate the dashboard view with correct column names
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
  c.id AS candidate_id,
  c.jamb_reg_no,
  c.username,
  c.program_choice_1,
  c.jamb_score,
  c.state_of_origin,
  c.application_status,
  c.payment_status,
  c.admission_status,
  a.decision AS admission_decision,
  a.decided_at,
  s.matric_no,
  ap.programme_code,
  ap.department_code
FROM candidates c
LEFT JOIN admissions a ON a.candidate_id = c.id
LEFT JOIN students s ON s.candidate_id = c.id
LEFT JOIN applications ap ON ap.candidate_id = c.id;

-- ---------- Verification ----------

-- Verify the fixes
DO $$
DECLARE
    candidate_count INTEGER;
    program_choice_count INTEGER;
    jamb_score_count INTEGER;
    state_count INTEGER;
BEGIN
    -- Count candidates with program choices
    SELECT COUNT(*) INTO program_choice_count 
    FROM candidates 
    WHERE program_choice_1 IS NOT NULL;
    
    -- Count candidates with JAMB scores
    SELECT COUNT(*) INTO jamb_score_count 
    FROM candidates 
    WHERE jamb_score IS NOT NULL;
    
    -- Count candidates with state of origin
    SELECT COUNT(*) INTO state_count 
    FROM candidates 
    WHERE state_of_origin IS NOT NULL;
    
    -- Count total candidates
    SELECT COUNT(*) INTO candidate_count FROM candidates;
    
    RAISE NOTICE 'Schema alignment completed:';
    RAISE NOTICE '- Total candidates: %', candidate_count;
    RAISE NOTICE '- Candidates with program choices: %', program_choice_count;
    RAISE NOTICE '- Candidates with JAMB scores: %', jamb_score_count;
    RAISE NOTICE '- Candidates with state of origin: %', state_count;
END $$;
