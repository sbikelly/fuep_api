-- ============================================
-- Migration: Add isFirstLogin flag to candidates
-- ============================================
-- This migration adds the is_first_login boolean flag
-- to the candidates table for tracking first-time logins

BEGIN;

-- Add is_first_login column to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN NOT NULL DEFAULT TRUE;

-- Update existing candidates to have is_first_login = true
-- (assuming they haven't logged in yet)
UPDATE candidates 
SET is_first_login = true 
WHERE is_first_login IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN candidates.is_first_login IS 'Flag for first-time login. Set to true when password is created, false after first successful login.';

COMMIT;
