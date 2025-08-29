-- ============================================
-- Migration: Simplify Academic Schema
-- ============================================
-- This migration removes program-related tables and simplifies
-- the academic structure to only include faculties and departments

BEGIN;

-- Drop program-related tables and their dependencies
DROP TABLE IF EXISTS program_departments CASCADE;
DROP TABLE IF EXISTS programs CASCADE;

-- Remove any foreign key references to programs in other tables
-- Check if applications table has program_id column and remove it if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applications' AND column_name = 'program_id'
    ) THEN
        ALTER TABLE applications DROP COLUMN IF EXISTS program_id;
    END IF;
END $$;

-- Update any remaining references to use department_id instead of program_id
-- This aligns with the simplified approach where course of study = department

-- Add any missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_departments_faculty_id ON departments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

CREATE INDEX IF NOT EXISTS idx_faculties_code ON faculties(code);
CREATE INDEX IF NOT EXISTS idx_faculties_is_active ON faculties(is_active);

-- Ensure the simplified structure is clean
-- Remove any orphaned departments (departments without valid faculty)
DELETE FROM departments 
WHERE faculty_id NOT IN (SELECT id FROM faculties WHERE is_active = true);

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'departments_faculty_id_fkey'
    ) THEN
        ALTER TABLE departments 
        ADD CONSTRAINT departments_faculty_id_fkey 
        FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE;
    END IF;
END $$;

COMMIT;
