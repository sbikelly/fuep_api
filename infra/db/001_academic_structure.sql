-- Migration: Simplified Academic Structure
-- Date: 2025-08-29
-- Description: Create simplified academic structure with only faculties and departments

BEGIN;

-- ============================================
-- Faculties Table
-- ============================================
CREATE TABLE IF NOT EXISTS faculties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- Departments Table
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_faculties_code ON faculties(code);
CREATE INDEX IF NOT EXISTS idx_faculties_active ON faculties(is_active);
CREATE INDEX IF NOT EXISTS idx_departments_faculty_id ON departments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER faculties_set_updated_at
    BEFORE UPDATE ON faculties
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER departments_set_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Insert sample data for testing
INSERT INTO faculties (name, code, description) VALUES
    ('Faculty of Engineering', 'ENG', 'Engineering and Technology programs'),
    ('Faculty of Science', 'SCI', 'Pure and Applied Sciences'),
    ('Faculty of Management Sciences', 'MGT', 'Business and Management programs'),
    ('Faculty of Social Sciences', 'SOC', 'Social Sciences and Humanities')
ON CONFLICT (code) DO NOTHING;

INSERT INTO departments (faculty_id, name, code, description) VALUES
    ((SELECT id FROM faculties WHERE code = 'ENG'), 'Computer Engineering', 'CEN', 'Computer Engineering Department'),
    ((SELECT id FROM faculties WHERE code = 'ENG'), 'Electrical Engineering', 'EEN', 'Electrical Engineering Department'),
    ((SELECT id FROM faculties WHERE code = 'ENG'), 'Mechanical Engineering', 'MEN', 'Mechanical Engineering Department'),
    ((SELECT id FROM faculties WHERE code = 'SCI'), 'Computer Science', 'CSC', 'Computer Science Department'),
    ((SELECT id FROM faculties WHERE code = 'SCI'), 'Mathematics', 'MAT', 'Mathematics Department'),
    ((SELECT id FROM faculties WHERE code = 'MGT'), 'Business Administration', 'BAD', 'Business Administration Department'),
    ((SELECT id FROM faculties WHERE code = 'MGT'), 'Accounting', 'ACC', 'Accounting Department'),
    ((SELECT id FROM faculties WHERE code = 'SOC'), 'Economics', 'ECO', 'Economics Department'),
    ((SELECT id FROM faculties WHERE code = 'SOC'), 'Political Science', 'POL', 'Political Science Department')
ON CONFLICT (code) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE faculties IS 'Academic faculties organizing departments';
COMMENT ON TABLE departments IS 'Academic departments within faculties';

COMMENT ON COLUMN faculties.code IS 'Unique faculty code (e.g., ENG, SCI)';
COMMENT ON COLUMN departments.code IS 'Unique department code (e.g., CEN, EEN)';
COMMENT ON COLUMN departments.faculty_id IS 'Reference to the faculty this department belongs to';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 002_academic_structure completed successfully';
    RAISE NOTICE 'Created tables: faculties, departments';
    RAISE NOTICE 'Added sample data for testing';
    RAISE NOTICE 'Simplified academic structure - no programs';
END $$;

COMMIT;
