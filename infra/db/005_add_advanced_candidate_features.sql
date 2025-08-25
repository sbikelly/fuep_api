-- Migration: Add Advanced Candidate Management Features
-- Description: Add missing columns and tables for progressive registration, temporary passwords, and email functionality

BEGIN;

-- Add missing columns to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS temp_password_flag BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS post_utme_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS acceptance_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS school_fees_paid BOOLEAN DEFAULT FALSE;

-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS biodata_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS education_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS next_of_kin_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sponsor_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS state VARCHAR(50),
ADD COLUMN IF NOT EXISTS lga VARCHAR(100),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS nationality VARCHAR(50),
ADD COLUMN IF NOT EXISTS religion VARCHAR(50),
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
ADD COLUMN IF NOT EXISTS secondary_school VARCHAR(200),
ADD COLUMN IF NOT EXISTS secondary_school_year INTEGER,
ADD COLUMN IF NOT EXISTS secondary_school_certificate VARCHAR(100),
ADD COLUMN IF NOT EXISTS jamb_subject_1 VARCHAR(50),
ADD COLUMN IF NOT EXISTS jamb_subject_2 VARCHAR(50),
ADD COLUMN IF NOT EXISTS jamb_subject_3 VARCHAR(50),
ADD COLUMN IF NOT EXISTS jamb_subject_4 VARCHAR(50),
ADD COLUMN IF NOT EXISTS next_of_kin_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS next_of_kin_relationship VARCHAR(100),
ADD COLUMN IF NOT EXISTS next_of_kin_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS next_of_kin_address TEXT,
ADD COLUMN IF NOT EXISTS next_of_kin_occupation VARCHAR(100),
ADD COLUMN IF NOT EXISTS sponsor_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS sponsor_relationship VARCHAR(100),
ADD COLUMN IF NOT EXISTS sponsor_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS sponsor_address TEXT,
ADD COLUMN IF NOT EXISTS sponsor_occupation VARCHAR(100),
ADD COLUMN IF NOT EXISTS sponsor_income_range VARCHAR(50);

-- Create payment_purposes table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_purposes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  purpose VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default payment purposes
INSERT INTO payment_purposes (name, purpose, amount, description) VALUES
  ('Post-UTME Fee', 'POST_UTME', 2000.00, 'Post-UTME examination fee'),
  ('Acceptance Fee', 'ACCEPTANCE', 50000.00, 'Acceptance fee for admitted students'),
  ('School Fees', 'SCHOOL_FEES', 150000.00, 'Annual school fees')
ON CONFLICT (purpose) DO NOTHING;

-- Create email_logs table for tracking email communications
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  email_type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_temp_password_flag ON candidates(temp_password_flag);
CREATE INDEX IF NOT EXISTS idx_candidates_registration_completed ON candidates(registration_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_biodata_completed ON profiles(biodata_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_education_completed ON profiles(education_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_next_of_kin_completed ON profiles(next_of_kin_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_sponsor_completed ON profiles(sponsor_completed);
CREATE INDEX IF NOT EXISTS idx_email_logs_candidate_id ON email_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Update existing candidates to have default values
UPDATE candidates SET 
  temp_password_flag = FALSE,
  registration_completed = FALSE,
  post_utme_paid = FALSE,
  acceptance_paid = FALSE,
  school_fees_paid = FALSE
WHERE temp_password_flag IS NULL;

-- Update existing profiles to have default values
UPDATE profiles SET 
  biodata_completed = FALSE,
  education_completed = FALSE,
  next_of_kin_completed = FALSE,
  sponsor_completed = FALSE
WHERE biodata_completed IS NULL;

COMMIT;
