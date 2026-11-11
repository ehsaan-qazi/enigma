-- =============================================================================
-- Migration: Add institution and role columns to profiles table
-- Supports student registration and profile metadata
-- =============================================================================

ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS institution TEXT,
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student'
    CHECK (role IN ('student', 'instructor', 'evaluator'));
