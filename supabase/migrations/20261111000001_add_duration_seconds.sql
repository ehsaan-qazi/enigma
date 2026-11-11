-- =============================================================================
-- Migration: Add duration_seconds to responses table
-- Fulfills Ahmed's REQ-H2 audio response metadata support
-- =============================================================================

ALTER TABLE IF EXISTS public.responses
ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC;
