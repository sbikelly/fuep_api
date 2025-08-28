-- ============================================
-- Migration: Add Missing Candidate Columns
-- ============================================
-- This migration adds missing columns that the code expects
-- and creates table aliases for compatibility

BEGIN;

-- Add missing columns to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS temp_password_flag BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admission_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS rrr VARCHAR(100);

-- Create index for the new columns
CREATE INDEX IF NOT EXISTS idx_candidates_admission_status ON candidates(admission_status);
CREATE INDEX IF NOT EXISTS idx_candidates_payment_status ON candidates(payment_status);
CREATE INDEX IF NOT EXISTS idx_candidates_rrr ON candidates(rrr);

-- Create a view alias for payment_transactions to maintain compatibility
-- This allows existing code to work without changes
CREATE OR REPLACE VIEW payment_transactions AS
SELECT 
    id,
    candidate_id,
    purpose as payment_purpose,
    provider,
    provider_ref,
    amount,
    currency,
    status as payment_status,
    idempotency_key,
    request_hash,
    response_snapshot,
    status_code,
    first_request_at,
    last_request_at,
    replay_count,
    external_reference,
    metadata,
    webhook_received_at,
    verified_at,
    receipt_url,
    expires_at,
    raw_payload,
    created_at,
    updated_at,
    payment_level,
    session
FROM payments;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_transactions TO fuep;

COMMIT;
