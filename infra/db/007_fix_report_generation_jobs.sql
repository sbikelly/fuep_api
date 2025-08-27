-- Migration to fix report_generation_jobs table schema
-- This aligns the database schema with the updated AdminReportService interface

-- Add new columns
ALTER TABLE report_generation_jobs 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS format VARCHAR(16),
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS total_records INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processed_records INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Copy data from old columns to new columns where possible
UPDATE report_generation_jobs 
SET 
  created_by = generated_by,
  started_at = processing_started_at,
  completed_at = processing_completed_at,
  file_path = file_url,
  updated_at = created_at;

-- Set default values for required columns
UPDATE report_generation_jobs 
SET 
  name = COALESCE(name, 'Report_' || report_type || '_' || id::text),
  description = COALESCE(description, 'Auto-generated report'),
  format = COALESCE(format, 'pdf'),
  total_records = COALESCE(total_records, 0),
  processed_records = COALESCE(processed_records, 0);

-- Make new required columns NOT NULL
ALTER TABLE report_generation_jobs 
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN format SET NOT NULL,
ALTER COLUMN total_records SET NOT NULL,
ALTER COLUMN processed_records SET NOT NULL,
ALTER COLUMN created_by SET NOT NULL;

-- Add foreign key constraint for created_by
ALTER TABLE report_generation_jobs 
ADD CONSTRAINT report_generation_jobs_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES admin_users(id);

-- Drop old columns
ALTER TABLE report_generation_jobs 
DROP COLUMN IF EXISTS file_url,
DROP COLUMN IF EXISTS generated_by,
DROP COLUMN IF EXISTS processing_started_at,
DROP COLUMN IF EXISTS processing_completed_at;

-- Add updated_at trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'report_generation_jobs_set_updated_at'
  ) THEN
    CREATE TRIGGER report_generation_jobs_set_updated_at
    BEFORE UPDATE ON report_generation_jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_report_generation_jobs_name ON report_generation_jobs(name);
CREATE INDEX IF NOT EXISTS idx_report_generation_jobs_format ON report_generation_jobs(format);
CREATE INDEX IF NOT EXISTS idx_report_generation_jobs_created_by ON report_generation_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_report_generation_jobs_created_at ON report_generation_jobs(created_at);

-- Update existing records to have proper status values
UPDATE report_generation_jobs 
SET status = 'completed' 
WHERE status = 'success' OR status = 'finished';

UPDATE report_generation_jobs 
SET status = 'failed' 
WHERE status = 'error' OR status = 'cancelled';

-- Ensure status column only has valid values
ALTER TABLE report_generation_jobs 
ADD CONSTRAINT check_status_values 
CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Add comments
COMMENT ON TABLE report_generation_jobs IS 'Asynchronous report generation and processing with updated schema';
COMMENT ON COLUMN report_generation_jobs.name IS 'Name of the report job';
COMMENT ON COLUMN report_generation_jobs.description IS 'Description of the report job';
COMMENT ON COLUMN report_generation_jobs.format IS 'Output format (pdf, excel, csv, json)';
COMMENT ON COLUMN report_generation_jobs.file_path IS 'Path to the generated report file';
COMMENT ON COLUMN report_generation_jobs.file_size IS 'Size of the generated report file in bytes';
COMMENT ON COLUMN report_generation_jobs.total_records IS 'Total number of records to process';
COMMENT ON COLUMN report_generation_jobs.processed_records IS 'Number of records processed so far';
COMMENT ON COLUMN report_generation_jobs.started_at IS 'When processing started';
COMMENT ON COLUMN report_generation_jobs.completed_at IS 'When processing completed';
COMMENT ON COLUMN report_generation_jobs.created_by IS 'Admin user who created the job';
COMMENT ON COLUMN report_generation_jobs.updated_at IS 'Last update timestamp';
