-- Simplify event categories enum to just conference and trade_show
DROP TYPE IF EXISTS public.event_category CASCADE;
CREATE TYPE public.event_category AS ENUM ('conference', 'trade_show');

-- Add podcast-specific columns to user_sessions
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS generated_summary TEXT,
ADD COLUMN IF NOT EXISTS podcast_url TEXT,
ADD COLUMN IF NOT EXISTS transcript_summary TEXT,
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'uploaded',
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS generated_title TEXT;

-- Update existing sessions to use new category values
UPDATE public.user_sessions 
SET category = 'conference' 
WHERE category NOT IN ('conference', 'trade_show');

-- Create index for better performance on processing status
CREATE INDEX IF NOT EXISTS idx_user_sessions_processing_status ON public.user_sessions(processing_status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON public.user_sessions(created_at DESC);

-- Update the category column to use the new enum
ALTER TABLE public.user_sessions 
ALTER COLUMN category TYPE event_category USING category::event_category;

-- Set default category
ALTER TABLE public.user_sessions 
ALTER COLUMN category SET DEFAULT 'conference';