-- First, update existing data to use simplified categories
UPDATE public.user_sessions 
SET category = CASE 
  WHEN category IN ('conference', 'earnings_call', 'board_meeting', 'investor_update', 'due_diligence', 'portfolio_review', 'market_update', 'team_meeting') THEN 'conference'
  ELSE 'conference'
END;

-- Add new podcast-specific columns to user_sessions
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS generated_summary TEXT,
ADD COLUMN IF NOT EXISTS podcast_url TEXT,
ADD COLUMN IF NOT EXISTS transcript_summary TEXT,
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'uploaded',
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS generated_title TEXT;

-- Create a new simplified enum
CREATE TYPE public.event_category_new AS ENUM ('conference', 'trade_show');

-- Update the column to use the new enum
ALTER TABLE public.user_sessions 
ALTER COLUMN category TYPE event_category_new USING 'conference'::event_category_new;

-- Drop the old enum and rename the new one
DROP TYPE public.event_category;
ALTER TYPE public.event_category_new RENAME TO event_category;

-- Set the default for category
ALTER TABLE public.user_sessions 
ALTER COLUMN category SET DEFAULT 'conference'::event_category;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_processing_status ON public.user_sessions(processing_status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON public.user_sessions(created_at DESC);