-- ============================================
-- Migration: Complete Candidate Schema Refactor
-- ============================================
-- This migration completely replaces the old candidate schema
-- with the new simplified one

BEGIN;

-- Drop all existing candidate-related tables and views
DROP VIEW IF EXISTS v_candidate_management CASCADE;
DROP TABLE IF EXISTS candidate_notes CASCADE;
DROP TABLE IF EXISTS candidate_status_changes CASCADE;
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
    mode_of_entry VARCHAR(10) DEFAULT 'UTME', -- UTME or DE
    marital_status VARCHAR(20) DEFAULT 'single',
    passport_photo_url TEXT,
    signature_url TEXT,
    
    -- Registration progress flags
    registration_completed BOOLEAN NOT NULL DEFAULT FALSE,
    biodata_completed BOOLEAN NOT NULL DEFAULT FALSE,
    education_completed BOOLEAN NOT NULL DEFAULT FALSE,
    next_of_kin_completed BOOLEAN NOT NULL DEFAULT FALSE,
    sponsor_completed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Authentication
    password_hash TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_candidates_jamb_reg_no ON candidates(jamb_reg_no);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_phone ON candidates(phone);
CREATE INDEX idx_candidates_mode_of_entry ON candidates(mode_of_entry);
CREATE INDEX idx_candidates_registration_completed ON candidates(registration_completed);

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
    certificate_upload_urls TEXT[], -- Array of certificate URLs
    
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
-- Simplified Uploads Table (for documents)
-- ============================================
CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- passport, certificate, transcript, etc.
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(128),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for uploads
CREATE INDEX idx_uploads_candidate_id ON uploads(candidate_id);
CREATE INDEX idx_uploads_type ON uploads(type);

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

CREATE TRIGGER uploads_set_updated_at
    BEFORE UPDATE ON uploads
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- Sample data insertion for testing
-- ============================================
-- Insert sample candidates for testing
INSERT INTO candidates (jamb_reg_no, firstname, surname, email, phone, mode_of_entry) VALUES
('12345678901', 'John', 'Doe', 'john.doe@example.com', '+2348012345678', 'UTME'),
('12345678902', 'Jane', 'Smith', 'jane.smith@example.com', '+2348012345679', 'DE');

-- Insert sample applications
INSERT INTO applications (candidate_id, application_number, session, status) VALUES
((SELECT id FROM candidates WHERE jamb_reg_no = '12345678901'), 'APP2024001', '2024/2025', 'pending'),
((SELECT id FROM candidates WHERE jamb_reg_no = '12345678902'), 'APP2024002', '2024/2025', 'pending');

COMMIT;
