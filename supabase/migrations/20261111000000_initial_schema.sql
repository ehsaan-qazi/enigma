-- =============================================================================
-- ENIGMA Platform Supabase Database Migration
-- Tables: profiles, submissions, vivas, questions, responses, evaluations, knowledge_gaps
-- Includes: Foreign Keys, Indexes, Status Checks, RLS Policies, Auth Trigger, Storage Buckets
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Table: profiles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- Auto-create profile on Supabase auth.users signup
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NEW.email
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. Table: submissions
-- Status: uploaded | processing | ready | failed
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/pdf',
    file_size BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'uploaded'
        CHECK (status IN ('uploaded', 'processing', 'ready', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own submissions"
    ON public.submissions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own submissions"
    ON public.submissions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions"
    ON public.submissions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own submissions"
    ON public.submissions FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. Table: vivas
-- Status: created | in_progress | completed | failed
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vivas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'created'
        CHECK (status IN ('created', 'in_progress', 'completed', 'failed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_vivas_user_id ON public.vivas(user_id);
CREATE INDEX IF NOT EXISTS idx_vivas_submission_id ON public.vivas(submission_id);
CREATE INDEX IF NOT EXISTS idx_vivas_status ON public.vivas(status);

ALTER TABLE public.vivas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vivas"
    ON public.vivas FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vivas"
    ON public.vivas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vivas"
    ON public.vivas FOR UPDATE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. Table: questions
-- Question types: primary | follow_up
-- Difficulties: easy | medium | hard
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viva_id UUID NOT NULL REFERENCES public.vivas(id) ON DELETE CASCADE,
    concept TEXT NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'primary'
        CHECK (question_type IN ('primary', 'follow_up')),
    difficulty TEXT NOT NULL DEFAULT 'medium'
        CHECK (difficulty IN ('easy', 'medium', 'hard')),
    expected_concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
    sequence_number INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_questions_viva_id ON public.questions(viva_id);
CREATE INDEX IF NOT EXISTS idx_questions_sequence ON public.questions(viva_id, sequence_number);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view questions for their own vivas"
    ON public.questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.vivas v
            WHERE v.id = questions.viva_id AND v.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert questions for their own vivas"
    ON public.questions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.vivas v
            WHERE v.id = questions.viva_id AND v.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update questions for their own vivas"
    ON public.questions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.vivas v
            WHERE v.id = questions.viva_id AND v.user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- 5. Table: responses
-- Status: uploaded | transcribing | evaluating | completed | failed
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viva_id UUID NOT NULL REFERENCES public.vivas(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    audio_storage_path TEXT,
    transcription TEXT,
    status TEXT NOT NULL DEFAULT 'uploaded'
        CHECK (status IN ('uploaded', 'transcribing', 'evaluating', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_responses_viva_id ON public.responses(viva_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON public.responses(question_id);

ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses for their own vivas"
    ON public.responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.vivas v
            WHERE v.id = responses.viva_id AND v.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert responses for their own vivas"
    ON public.responses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.vivas v
            WHERE v.id = responses.viva_id AND v.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update responses for their own vivas"
    ON public.responses FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.vivas v
            WHERE v.id = responses.viva_id AND v.user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- 6. Table: evaluations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES public.responses(id) ON DELETE CASCADE,
    correctness NUMERIC(4, 2) NOT NULL DEFAULT 0.0 CHECK (correctness >= 0 AND correctness <= 100),
    completeness NUMERIC(4, 2) NOT NULL DEFAULT 0.0 CHECK (completeness >= 0 AND completeness <= 100),
    reasoning_quality NUMERIC(4, 2) NOT NULL DEFAULT 0.0 CHECK (reasoning_quality >= 0 AND reasoning_quality <= 100),
    feedback TEXT NOT NULL DEFAULT '',
    demonstrated_concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence NUMERIC(4, 2) NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_evaluations_response_id ON public.evaluations(response_id);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view evaluations for their own responses"
    ON public.evaluations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.responses r
            JOIN public.vivas v ON v.id = r.viva_id
            WHERE r.id = evaluations.response_id AND v.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert evaluations for their own responses"
    ON public.evaluations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.responses r
            JOIN public.vivas v ON v.id = r.viva_id
            WHERE r.id = evaluations.response_id AND v.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update evaluations for their own responses"
    ON public.evaluations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.responses r
            JOIN public.vivas v ON v.id = r.viva_id
            WHERE r.id = evaluations.response_id AND v.user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- 7. Table: knowledge_gaps
-- Severity: low | medium | high
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viva_id UUID NOT NULL REFERENCES public.vivas(id) ON DELETE CASCADE,
    concept TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium'
        CHECK (severity IN ('low', 'medium', 'high')),
    explanation TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_user_id ON public.knowledge_gaps(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_viva_id ON public.knowledge_gaps(viva_id);

ALTER TABLE public.knowledge_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own knowledge gaps"
    ON public.knowledge_gaps FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own knowledge gaps"
    ON public.knowledge_gaps FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge gaps"
    ON public.knowledge_gaps FOR UPDATE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 8. Storage Buckets: 'documents' and 'audio' (Private)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('documents', 'documents', false, 52428800, ARRAY['application/pdf']),
    ('audio', 'audio', false, 52428800, ARRAY['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies for 'documents' bucket
CREATE POLICY "Users can upload their own documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents'
        AND (auth.uid())::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view and download their own documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents'
        AND (auth.uid())::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'documents'
        AND (auth.uid())::text = (storage.foldername(name))[1]
    );

-- Storage RLS Policies for 'audio' bucket
CREATE POLICY "Users can upload their own audio responses"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'audio'
        AND (auth.uid())::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view and download their own audio responses"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'audio'
        AND (auth.uid())::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own audio responses"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'audio'
        AND (auth.uid())::text = (storage.foldername(name))[1]
    );
