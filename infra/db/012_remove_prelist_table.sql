-- ============================================
-- Migration: Remove old prelist table and logic
-- ============================================
-- This migration removes the old prelist system
-- and replaces it with direct candidate management

BEGIN;

-- Drop the old prelist table if it exists
DROP TABLE IF EXISTS jamb_prelist CASCADE;

-- Drop any prelist-related views
DROP VIEW IF EXISTS v_prelist_summary CASCADE;
DROP VIEW IF EXISTS v_prelist_upload_stats CASCADE;

-- Remove any prelist-related functions
DROP FUNCTION IF EXISTS get_prelist_stats() CASCADE;
DROP FUNCTION IF EXISTS process_prelist_upload() CASCADE;

-- Update any remaining references to use candidates table directly
-- (This will be handled by the new batch upload system)

COMMIT;
