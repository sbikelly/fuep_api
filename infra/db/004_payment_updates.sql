-- ============================================
-- Migration: Update payments table to align with simplified Remita-only interface
-- ============================================

-- Add payment level and session columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_level varchar(16),
ADD COLUMN IF NOT EXISTS session varchar(16);

-- Add RRR column for Remita Retrieval Reference
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS rrr varchar(100);

-- Add payment URL column
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_url text;

-- Add webhook received timestamp
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS webhook_received_at timestamp with time zone;

-- Add verification timestamp
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_payments_level ON payments(payment_level);
CREATE INDEX IF NOT EXISTS idx_payments_session ON payments(session);
CREATE INDEX IF NOT EXISTS idx_payments_rrr ON payments(rrr);

-- Update the idempotency key to include level and session
-- First, drop the existing unique constraint
DROP INDEX IF EXISTS ux_payments_idempotency_key;

-- Recreate the unique constraint with the new fields
CREATE UNIQUE INDEX ux_payments_idempotency_key 
ON payments(candidate_id, purpose, session, payment_level);

-- Update payment status enum to match the interface
-- Instead of dropping and recreating the column, just update the constraint
-- This preserves the existing data and avoids view dependency issues

-- Add constraint for the new status values (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_payment_status' 
    AND conrelid = 'payments'::regclass
  ) THEN
    ALTER TABLE payments 
    ADD CONSTRAINT chk_payment_status 
    CHECK (status IN ('initiated', 'pending', 'processing', 'success', 'failed', 'cancelled', 'disputed', 'refunded'));
  END IF;
END $$;

-- Update existing status values to match the new enum
UPDATE payments 
SET status = CASE 
  WHEN status = 'completed' THEN 'success'
  WHEN status = 'processing' THEN 'processing'
  WHEN status = 'cancelled' THEN 'cancelled'
  WHEN status = 'failed' THEN 'failed'
  WHEN status = 'pending' THEN 'pending'
  ELSE 'pending'
END
WHERE status NOT IN ('initiated', 'pending', 'processing', 'success', 'failed', 'cancelled', 'disputed', 'refunded');

-- Note: currency and provider columns are kept for now due to view dependencies
-- They will be removed in a future migration after updating the views
-- ALTER TABLE payments DROP COLUMN IF EXISTS currency;
-- ALTER TABLE payments DROP COLUMN IF EXISTS provider;

-- Add comments to document the changes
COMMENT ON COLUMN payments.payment_level IS 'Payment level (e.g., 100, 200, 100L, etc.)';
COMMENT ON COLUMN payments.session IS 'Academic session (e.g., 2024/2025)';
COMMENT ON COLUMN payments.rrr IS 'Remita Retrieval Reference';
COMMENT ON COLUMN payments.payment_url IS 'Payment URL for the transaction';
COMMENT ON COLUMN payments.webhook_received_at IS 'Timestamp when webhook was received';
COMMENT ON COLUMN payments.verified_at IS 'Timestamp when payment was verified';

-- Update existing payments to have a default session if not set
UPDATE payments 
SET session = '2024/2025' 
WHERE session IS NULL;

-- Make session NOT NULL after setting default values
ALTER TABLE payments 
ALTER COLUMN session SET NOT NULL;
