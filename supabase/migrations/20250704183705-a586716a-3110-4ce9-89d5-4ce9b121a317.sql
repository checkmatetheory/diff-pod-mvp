-- Add new podcast-specific columns to user_sessions first
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS generated_summary TEXT,
ADD COLUMN IF NOT EXISTS podcast_url TEXT,
ADD COLUMN IF NOT EXISTS transcript_summary TEXT,
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'uploaded',
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS generated_title TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_processing_status ON public.user_sessions(processing_status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON public.user_sessions(created_at DESC);

-- Update all existing categories to 'conference' (simplification for now)
UPDATE public.user_sessions SET category = 'conference'::event_category;