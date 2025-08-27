-- Migration: Add Faculty, Department, and Program tables
-- Date: 2025-08-23
-- Description: Create structured tables for academic organization

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create faculties table
CREATE TABLE IF NOT EXISTS faculties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create departments table
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

-- Create program_departments junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS program_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(program_id, department_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_programs_code ON programs(code);
CREATE INDEX IF NOT EXISTS idx_programs_active ON programs(is_active);
CREATE INDEX IF NOT EXISTS idx_faculties_code ON faculties(code);
CREATE INDEX IF NOT EXISTS idx_faculties_active ON faculties(is_active);
CREATE INDEX IF NOT EXISTS idx_departments_faculty_id ON departments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);
CREATE INDEX IF NOT EXISTS idx_program_departments_program_id ON program_departments(program_id);
CREATE INDEX IF NOT EXISTS idx_program_departments_department_id ON program_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_program_departments_active ON program_departments(is_active);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER programs_set_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER faculties_set_updated_at
    BEFORE UPDATE ON faculties
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER departments_set_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER program_departments_set_updated_at
    BEFORE UPDATE ON program_departments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Insert sample data for testing
INSERT INTO programs (name, code, description) VALUES
    ('Computer Science', 'CSC', 'Bachelor of Science in Computer Science'),
    ('Electrical Engineering', 'EEE', 'Bachelor of Engineering in Electrical Engineering'),
    ('Mechanical Engineering', 'MEE', 'Bachelor of Engineering in Mechanical Engineering'),
    ('Business Administration', 'BBA', 'Bachelor of Business Administration'),
    ('Economics', 'ECO', 'Bachelor of Science in Economics')
ON CONFLICT (code) DO NOTHING;

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

-- Link programs to departments
INSERT INTO program_departments (program_id, department_id) VALUES
    ((SELECT id FROM programs WHERE code = 'CSC'), (SELECT id FROM departments WHERE code = 'CSC')),
    ((SELECT id FROM programs WHERE code = 'EEE'), (SELECT id FROM departments WHERE code = 'EEN')),
    ((SELECT id FROM programs WHERE code = 'MEE'), (SELECT id FROM departments WHERE code = 'MEN')),
    ((SELECT id FROM programs WHERE code = 'BBA'), (SELECT id FROM departments WHERE code = 'BAD')),
    ((SELECT id FROM programs WHERE code = 'ECO'), (SELECT id FROM departments WHERE code = 'ECO'))
ON CONFLICT (program_id, department_id) DO NOTHING;

-- Add foreign key constraints to applications table if they don't exist
DO $$
BEGIN
    -- Add faculty_id column to applications if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'applications' AND column_name = 'faculty_id') THEN
        ALTER TABLE applications ADD COLUMN faculty_id UUID REFERENCES faculties(id);
        RAISE NOTICE 'Added faculty_id column to applications table';
    END IF;
    
    -- Add program_id column to applications if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'applications' AND column_name = 'program_id') THEN
        ALTER TABLE applications ADD COLUMN program_id UUID REFERENCES programs(id);
        RAISE NOTICE 'Added program_id column to applications table';
    END IF;
    
    -- Add department_id column to applications if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'applications' AND column_name = 'department_id') THEN
        ALTER TABLE applications ADD COLUMN department_id UUID REFERENCES departments(id);
        RAISE NOTICE 'Added department_id column to applications table';
    END IF;
END $$;

-- Create indexes for the new foreign key columns
CREATE INDEX IF NOT EXISTS idx_applications_faculty_id ON applications(faculty_id);
CREATE INDEX IF NOT EXISTS idx_applications_program_id ON applications(program_id);
CREATE INDEX IF NOT EXISTS idx_applications_department_id ON applications(department_id);

-- Update existing applications to link to the new tables
UPDATE applications 
SET 
    program_id = (SELECT id FROM programs WHERE code = applications.programme_code),
    department_id = (SELECT id FROM departments WHERE code = applications.department_code),
    faculty_id = (SELECT d.faculty_id FROM departments d WHERE d.code = applications.department_code)
WHERE 
    applications.programme_code IS NOT NULL 
    AND applications.department_code IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE programs IS 'Academic programs offered by the institution';
COMMENT ON TABLE faculties IS 'Academic faculties organizing departments';
COMMENT ON TABLE departments IS 'Academic departments within faculties';
COMMENT ON TABLE program_departments IS 'Many-to-many relationship between programs and departments';

COMMENT ON COLUMN programs.code IS 'Unique program code (e.g., CSC, EEE)';
COMMENT ON COLUMN faculties.code IS 'Unique faculty code (e.g., ENG, SCI)';
COMMENT ON COLUMN departments.code IS 'Unique department code (e.g., CEN, EEN)';
COMMENT ON COLUMN departments.faculty_id IS 'Reference to the faculty this department belongs to';
COMMENT ON COLUMN program_departments.program_id IS 'Reference to the program';
COMMENT ON COLUMN program_departments.department_id IS 'Reference to the department';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 005_faculty_department_program_tables completed successfully';
    RAISE NOTICE 'Created tables: programs, faculties, departments, program_departments';
    RAISE NOTICE 'Added sample data for testing';
    RAISE NOTICE 'Updated applications table with foreign key relationships';
END $$;
