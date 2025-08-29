-- Migration: Remove Documents Module
-- Description: Remove all document-related tables and references as the documents module is being removed
-- Date: 2024-12-19

-- Drop uploads table if it exists
DROP TABLE IF EXISTS uploads CASCADE;

-- Drop any document-related views
DROP VIEW IF EXISTS document_uploads CASCADE;
DROP VIEW IF EXISTS candidate_documents CASCADE;

-- Remove any document-related indexes
-- (These will be dropped automatically when the table is dropped)

-- Remove any document-related triggers
-- (These will be dropped automatically when the table is dropped)

-- Note: The profiles table was already removed in previous migrations
-- Note: MinIO service and related environment variables should be removed from Docker configuration
-- Note: Document-related packages (minio, multer) should be removed from package.json
-- Note: Document-related types and interfaces should be removed from the codebase

COMMENT ON TABLE candidates IS 'Candidates table - document upload functionality removed';
