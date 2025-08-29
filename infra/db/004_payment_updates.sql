-- ============================================
-- Migration: Add payment level and session to payments table
-- ============================================

-- Add payment level and session columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_level varchar(16),
ADD COLUMN IF NOT EXISTS session varchar(16);

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_payments_level ON payments(payment_level);
CREATE INDEX IF NOT EXISTS idx_payments_session ON payments(session);

-- Update the idempotency key to include level and session
-- First, drop the existing unique constraint
DROP INDEX IF EXISTS ux_payments_idempotency_key;

-- Recreate the unique constraint with the new fields
CREATE UNIQUE INDEX ux_payments_idempotency_key 
ON payments(candidate_id, purpose, session, payment_level);

-- Add a comment to document the change
COMMENT ON COLUMN payments.payment_level IS 'Payment level (e.g., 100, 200, 100L, etc.)';
COMMENT ON COLUMN payments.session IS 'Academic session (e.g., 2024/2025)';

-- Update existing payments to have a default session if not set
UPDATE payments 
SET session = '2024/2025' 
WHERE session IS NULL;

-- Make session NOT NULL after setting default values
ALTER TABLE payments 
ALTER COLUMN session SET NOT NULL;
