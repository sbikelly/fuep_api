-- Migration: Simplify Payment Purposes Table
-- This migration replaces the complex payment_purposes table with a simple structure

-- Drop the existing complex payment_purposes table if it exists
DROP TABLE IF EXISTS payment_purposes CASCADE;

-- Create the new simplified payment_purposes table
CREATE TABLE payment_purposes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 varchar(100) NOT NULL,
  purpose              varchar(50) NOT NULL,
  description          text,
  amount               numeric(14,2) NOT NULL,
  is_active            boolean NOT NULL DEFAULT true,
  session              varchar(16) NOT NULL,
  level                varchar(10) NOT NULL,
  category             varchar(50), -- Changed from faculty_id to category
  created_by           uuid REFERENCES admin_users(id),
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_payment_purposes_session ON payment_purposes(session);
CREATE INDEX idx_payment_purposes_purpose ON payment_purposes(purpose);
CREATE INDEX idx_payment_purposes_active ON payment_purposes(is_active);
CREATE INDEX idx_payment_purposes_level ON payment_purposes(level);
CREATE INDEX idx_payment_purposes_category ON payment_purposes(category); -- Changed from faculty_id to category


-- Create unique constraint to prevent duplicate purposes per session, level and category
CREATE UNIQUE INDEX idx_payment_purposes_unique ON payment_purposes(session, purpose, level, category);

-- Insert some default payment purposes for the 2024/2025 session
INSERT INTO payment_purposes (name, purpose, description, amount, session, level, category, created_at, updated_at) VALUES
('POST_UTME', 'POST_UTME', 'Application fee for Post-UTME examination', 2500.00, '2024/2025', '100', 'EDUCATION', NOW(), NOW()),
('ACCEPTANCE', 'ACCEPTANCE', 'Fee for accepting admission offer', 50000.00, '2024/2025', '100', 'EDUCATION', NOW(), NOW()),
('SCHOOL_FEES', 'SCHOOL_FEES', 'First year school fees', 150000.00, '2024/2025', '100', 'EDUCATION', NOW(), NOW()),
('SCHOOL_FEES', 'SCHOOL_FEES', 'Second year school fees', 150000.00, '2024/2025', '200', 'EDUCATION', NOW(), NOW()),
('SCHOOL_FEES', 'SCHOOL_FEES', 'Third year school fees', 150000.00, '2024/2025', '300', 'EDUCATION', NOW(), NOW()),
('SCHOOL_FEES', 'SCHOOL_FEES', 'Fourth year school fees', 150000.00, '2024/2025', '400', 'EDUCATION', NOW(), NOW()),
('LIBRARY_FEE', 'LIBRARY_FEE', 'Annual library access fee', 5000.00, '2024/2025', '100', 'EDUCATION', NOW(), NOW()),
('HOSTEL_FEE', 'HOSTEL_FEE', 'On-campus accommodation fee', 25000.00, '2024/2025', '100', 'EDUCATION', NOW(), NOW()),
('MEDICAL_FEE', 'MEDICAL_FEE', 'Health services fee', 3000.00, '2024/2025', '100', 'HEALTH', NOW(), NOW()),
('SPORTS_FEE', 'SPORTS_FEE', 'Sports and recreation fee', 2000.00, '2024/2025', '100', 'EDUCATION', NOW(), NOW());

-- Add comments for documentation
COMMENT ON TABLE payment_purposes IS 'Simplified payment purposes configuration for different academic sessions and levels';
COMMENT ON COLUMN payment_purposes.name IS 'Human-readable name for the payment purpose';
COMMENT ON COLUMN payment_purposes.purpose IS 'Payment purpose code (POST_UTME, ACCEPTANCE, SCHOOL_FEES, etc.)';
COMMENT ON COLUMN payment_purposes.description IS 'Detailed description of what this payment covers';
COMMENT ON COLUMN payment_purposes.amount IS 'Amount in Nigerian Naira (NGN)';
COMMENT ON COLUMN payment_purposes.session IS 'Academic session (e.g., 2024/2025)';
COMMENT ON COLUMN payment_purposes.level IS 'Academic level (100, 200, 300, 400, 100L, etc.)';
COMMENT ON COLUMN payment_purposes.category IS 'Payment purpose category (EDUCATION, HEALTH, SCIENCES, etc.)';
COMMENT ON COLUMN payment_purposes.created_by IS 'Admin user who created this payment purpose';
COMMENT ON COLUMN payment_purposes.is_active IS 'Whether this payment purpose is currently active';
