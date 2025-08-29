-- ============================================
-- Migration: Simplify Candidate Schema
-- ============================================
-- This migration simplifies the candidate-related tables
-- to align with the new simplified interfaces

BEGIN;

-- Load necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS uploads CASCADE;
DROP TABLE IF EXISTS education_records CASCADE;
DROP TABLE IF EXISTS next_of_kin CASCADE;
DROP TABLE IF EXISTS sponsors CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS admissions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;

-- Drop existing enums that are no longer needed
DROP TYPE IF EXISTS upload_type CASCADE;
DROP TYPE IF EXISTS scan_status CASCADE;
DROP TYPE IF EXISTS decision_status CASCADE;

-- Create simplified enums
DO $$ BEGIN
    CREATE TYPE candidate_status AS ENUM ('pending', 'admitted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- Simplified Candidates Table
-- ============================================
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jamb_reg_no VARCHAR(20) NOT NULL UNIQUE,
    firstname VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    othernames VARCHAR(100),
    gender VARCHAR(10) DEFAULT 'other',
    dob DATE,
    nationality VARCHAR(64),
    state VARCHAR(64),
    lga VARCHAR(64),
    address TEXT,
    email VARCHAR(160),
    phone VARCHAR(32),
    department VARCHAR(100), -- Course of study
    department_id UUID, -- Foreign key to departments table (optional, add constraint if departments table exists)
    mode_of_entry VARCHAR(10) DEFAULT 'UTME', -- UTME or DE
    marital_status VARCHAR(20) DEFAULT 'single',
    passport_photo_url TEXT, -- Base64 encoded passport photo
    signature_url TEXT, -- Base64 encoded signature
    
    -- Registration progress flags
    registration_completed BOOLEAN NOT NULL DEFAULT FALSE,
    biodata_completed BOOLEAN NOT NULL DEFAULT FALSE,
    education_completed BOOLEAN NOT NULL DEFAULT FALSE,
    next_of_kin_completed BOOLEAN NOT NULL DEFAULT FALSE,
    sponsor_completed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Authentication
    password_hash TEXT,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_candidates_jamb_reg_no ON candidates(jamb_reg_no);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_phone ON candidates(phone);
CREATE INDEX idx_candidates_session ON candidates(mode_of_entry);

-- ============================================
-- Simplified Applications Table
-- ============================================
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    application_number VARCHAR(50) NOT NULL UNIQUE,
    session VARCHAR(16) NOT NULL,
    status candidate_status NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID, -- Admin user ID
    review_notes TEXT,
    
    -- Payment information
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_rrr VARCHAR(100), -- Remita RRR
    
    -- Form status
    form_printed BOOLEAN NOT NULL DEFAULT FALSE,
    printed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for applications
CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_session ON applications(session);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_payment_status ON applications(payment_status);

-- ============================================
-- Simplified Education Records Table
-- ============================================
CREATE TABLE education_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    
    -- Secondary School Information
    secondary_school VARCHAR(200),
    certificate_type VARCHAR(20), -- SSCE, GCE
    exam_year INTEGER,
    exam_type VARCHAR(20), -- WAEC, NECO, NABTEB
    seating_count INTEGER,
    exam_numbers TEXT[], -- Array of exam numbers for multiple sittings
    
    -- Subject Results (stored as JSON for flexibility)
    subjects JSONB NOT NULL DEFAULT '[]',
    
    -- UTME Information (for UTME candidates)
    jamb_score INTEGER,
    jamb_subjects JSONB, -- Array of subjects and scores
    
    -- DE Information (for DE candidates)
    certificate_type_de VARCHAR(20), -- NCE, ND, HND
    institution_name VARCHAR(200),
    field_of_study VARCHAR(100),
    start_date DATE,
    end_date DATE,
    cgpa VARCHAR(10),
    certificate_number VARCHAR(100),
    grade VARCHAR(20), -- A-Level grade
    -- Document upload fields removed
    
    -- Verification
    verification_status verification_status NOT NULL DEFAULT 'pending',
    verification_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for education records
CREATE INDEX idx_education_records_candidate_id ON education_records(candidate_id);
CREATE INDEX idx_education_records_verification_status ON education_records(verification_status);

-- ============================================
-- Simplified Next of Kin Table
-- ============================================
CREATE TABLE next_of_kin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    surname VARCHAR(100) NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    othernames VARCHAR(100),
    relationship VARCHAR(100) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(160),
    address TEXT NOT NULL,
    occupation VARCHAR(100) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for next of kin
CREATE INDEX idx_next_of_kin_candidate_id ON next_of_kin(candidate_id);

-- ============================================
-- Simplified Sponsors Table
-- ============================================
CREATE TABLE sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    surname VARCHAR(100) NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    othernames VARCHAR(100),
    relationship VARCHAR(100) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(160),
    address TEXT NOT NULL,
    occupation VARCHAR(100) NOT NULL,
    payment_responsibility BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for sponsors
CREATE INDEX idx_sponsors_candidate_id ON sponsors(candidate_id);

-- ============================================
-- Simplified Payments Table
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, success, failed, refunded
    purpose VARCHAR(50) NOT NULL, -- post_utme, acceptance, school_fee
    provider VARCHAR(50) DEFAULT 'remita',
    provider_ref VARCHAR(100), -- RRR or other provider reference
    description TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for payments
CREATE INDEX idx_payments_candidate_id ON payments(candidate_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_purpose ON payments(purpose);
CREATE INDEX idx_payments_provider_ref ON payments(provider_ref);

-- ============================================
-- Simplified Admissions Table
-- ============================================
CREATE TABLE admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    decision VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, admitted, rejected
    decision_date DATE,
    decision_notes TEXT,
    reviewed_by UUID, -- Admin user ID
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for admissions
CREATE INDEX idx_admissions_candidate_id ON admissions(candidate_id);
CREATE INDEX idx_admissions_decision ON admissions(decision);

-- ============================================
-- Simplified Payment Disputes Table
-- ============================================
CREATE TABLE payment_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- open, resolved, closed
    description TEXT NOT NULL,
    resolution_notes TEXT,
    resolved_by UUID, -- Admin user ID
    resolved_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for payment disputes
CREATE INDEX idx_payment_disputes_payment_id ON payment_disputes(payment_id);
CREATE INDEX idx_payment_disputes_status ON payment_disputes(status);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER candidates_set_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER applications_set_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER education_records_set_updated_at
    BEFORE UPDATE ON education_records
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER next_of_kin_set_updated_at
    BEFORE UPDATE ON next_of_kin
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER sponsors_set_updated_at
    BEFORE UPDATE ON sponsors
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER payments_set_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER admissions_set_updated_at
    BEFORE UPDATE ON admissions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER payment_disputes_set_updated_at
    BEFORE UPDATE ON payment_disputes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Sample data insertion for testing
-- ============================================
-- Insert sample candidates for testing
INSERT INTO candidates (jamb_reg_no, firstname, surname, email, phone, mode_of_entry, department_id) VALUES
('12345678901', 'John', 'Doe', 'john.doe@example.com', '+2348012345678', 'UTME', (SELECT id FROM departments WHERE code = 'CSC' LIMIT 1)),
('12345678902', 'Jane', 'Smith', 'jane.smith@example.com', '+2348012345679', 'DE', (SELECT id FROM departments WHERE code = 'CEN' LIMIT 1));

-- Insert sample applications
INSERT INTO applications (candidate_id, application_number, session, status) VALUES
((SELECT id FROM candidates WHERE jamb_reg_no = '12345678901'), 'APP2024001', '2024/2025', 'pending'),
((SELECT id FROM candidates WHERE jamb_reg_no = '12345678902'), 'APP2024002', '2024/2025', 'pending');

-- Insert sample payments
INSERT INTO payments (candidate_id, amount, status, purpose, provider_ref) VALUES
((SELECT id FROM candidates WHERE jamb_reg_no = '12345678901'), 2000.00, 'success', 'post_utme', 'RRR123456789'),
((SELECT id FROM candidates WHERE jamb_reg_no = '12345678902'), 2000.00, 'pending', 'post_utme', 'RRR123456790');

-- Insert sample admissions
INSERT INTO admissions (candidate_id, decision, decision_notes) VALUES
((SELECT id FROM candidates WHERE jamb_reg_no = '12345678901'), 'pending', 'Application under review'),
((SELECT id FROM candidates WHERE jamb_reg_no = '12345678902'), 'pending', 'Application under review');

COMMIT;
