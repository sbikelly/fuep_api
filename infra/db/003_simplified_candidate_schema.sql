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
    is_first_login BOOLEAN NOT NULL DEFAULT TRUE, -- Flag for first-time login
    
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

-- Insert sample candidates for testing
INSERT INTO candidates (
    jamb_reg_no, first_name, last_name, middle_name, gender, dob, 
    nationality, state, lga, address, email, phone, department, 
    department_id, mode_of_entry, marital_status, registration_completed,
    biodata_completed, education_completed, next_of_kin_completed, 
    sponsor_completed, password_hash, is_first_login, is_active
) VALUES
    (
        '202511595352DA', 'John', 'Doe', 'Michael', 'male', '2005-03-15',
        'Nigerian', 'Lagos', 'Ikeja', '123 Victoria Island, Lagos', 
        'john.doe@email.com', '+2348012345678', 'Computer Science',
        (SELECT id FROM departments WHERE code = 'CSC'), 'UTME', 'single',
        true, true, true, true, true, '$2b$10$example_hash', false, true
    ),
    (
        '202511595352DB', 'Jane', 'Smith', 'Elizabeth', 'female', '2005-07-22',
        'Nigerian', 'Abuja', 'Garki', '456 Wuse 2, Abuja', 
        'jane.smith@email.com', '+2348023456789', 'Business Administration',
        (SELECT id FROM departments WHERE code = 'BAD'), 'UTME', 'single',
        true, true, true, true, true, '$2b$10$example_hash', false, true
    ),
    (
        '202511595352DC', 'Ahmed', 'Hassan', 'Ibrahim', 'male', '2005-01-10',
        'Nigerian', 'Kano', 'Nassarawa', '789 Sabon Gari, Kano', 
        'ahmed.hassan@email.com', '+2348034567890', 'Computer Engineering',
        (SELECT id FROM departments WHERE code = 'CEN'), 'UTME', 'single',
        true, true, true, true, true, '$2b$10$example_hash', false, true
    ),
    (
        '202511595352DD', 'Fatima', 'Ali', 'Aisha', 'female', '2005-11-05',
        'Nigerian', 'Kaduna', 'Kaduna North', '321 Independence Way, Kaduna', 
        'fatima.ali@email.com', '+2348045678901', 'Accounting',
        (SELECT id FROM departments WHERE code = 'ACC'), 'UTME', 'single',
        true, true, true, true, true, '$2b$10$example_hash', false, true
    ),
    (
        '202511595352DE', 'Emmanuel', 'Okafor', 'Chukwu', 'male', '2005-09-18',
        'Nigerian', 'Enugu', 'Enugu North', '654 Independence Layout, Enugu', 
        'emmanuel.okafor@email.com', '+2348056789012', 'Electrical Engineering',
        (SELECT id FROM departments WHERE code = 'EEN'), 'UTME', 'single',
        true, true, true, true, true, '$2b$10$example_hash', false, true
    ),
    (
        '202511595352DF', 'Blessing', 'Okonkwo', 'Chioma', 'female', '2005-05-12',
        'Nigerian', 'Anambra', 'Awka', '987 Zik Avenue, Awka', 
        'blessing.okonkwo@email.com', '+2348067890123', 'Mathematics',
        (SELECT id FROM departments WHERE code = 'MAT'), 'UTME', 'single',
        true, true, true, true, true, '$2b$10$example_hash', false, true
    ),
    (
        '202511595352DG', 'Ibrahim', 'Musa', 'Yusuf', 'male', '2005-08-30',
        'Nigerian', 'Sokoto', 'Sokoto North', '147 Sultan Bello Road, Sokoto', 
        'ibrahim.musa@email.com', '+2348078901234', 'Political Science',
        (SELECT id FROM departments WHERE code = 'POL'), 'UTME', 'single',
        true, true, true, true, true, '$2b$10$example_hash', false, true
    ),
    (
        '202511595352DH', 'Grace', 'Eze', 'Ngozi', 'female', '2005-12-03',
        'Nigerian', 'Imo', 'Owerri', '258 Douglas Road, Owerri', 
        'grace.eze@email.com', '+2348089012345', 'Economics',
        (SELECT id FROM departments WHERE code = 'ECO'), 'UTME', 'single',
        true, true, true, true, true, '$2b$10$example_hash', false, true
    )
ON CONFLICT (jamb_reg_no) DO NOTHING;

COMMIT;
