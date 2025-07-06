-- Create enum for event categories
CREATE TYPE public.event_category AS ENUM (
  'conference',
  'earnings_call', 
  'board_meeting',
  'investor_update',
  'due_diligence',
  'portfolio_review',
  'market_update',
  'team_meeting'
);

-- Create enum for content types
CREATE TYPE public.content_type AS ENUM (
  'video_audio',
  'audio_only', 
  'transcript',
  'live_session'
);

-- Create portfolio companies table
CREATE TABLE public.portfolio_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  sector TEXT,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Create event series table for recurring events
CREATE TABLE public.event_series (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category event_category NOT NULL,
  portfolio_company_id UUID REFERENCES public.portfolio_companies(id),
  frequency TEXT, -- 'weekly', 'monthly', 'quarterly', 'annual'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Create favorites table for bookmarking sessions
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Create viewing progress table
CREATE TABLE public.viewing_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  total_seconds INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  last_viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Add new columns to user_sessions table
ALTER TABLE public.user_sessions ADD COLUMN category event_category DEFAULT 'conference';
ALTER TABLE public.user_sessions ADD COLUMN content_type content_type DEFAULT 'audio_only';
ALTER TABLE public.user_sessions ADD COLUMN portfolio_company_id UUID REFERENCES public.portfolio_companies(id);
ALTER TABLE public.user_sessions ADD COLUMN event_series_id UUID REFERENCES public.event_series(id);
ALTER TABLE public.user_sessions ADD COLUMN duration_seconds INTEGER;
ALTER TABLE public.user_sessions ADD COLUMN speaker_names TEXT[];
ALTER TABLE public.user_sessions ADD COLUMN tags TEXT[];
ALTER TABLE public.user_sessions ADD COLUMN description TEXT;
ALTER TABLE public.user_sessions ADD COLUMN thumbnail_url TEXT;

-- Enable RLS on new tables
ALTER TABLE public.portfolio_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewing_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for portfolio_companies
CREATE POLICY "Users can view their own portfolio companies" 
ON public.portfolio_companies 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolio companies" 
ON public.portfolio_companies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio companies" 
ON public.portfolio_companies 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolio companies" 
ON public.portfolio_companies 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for event_series
CREATE POLICY "Users can view their own event series" 
ON public.event_series 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own event series" 
ON public.event_series 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event series" 
ON public.event_series 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event series" 
ON public.event_series 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_favorites
CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" 
ON public.user_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.user_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for viewing_progress
CREATE POLICY "Users can view their own viewing progress" 
ON public.viewing_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own viewing progress" 
ON public.viewing_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own viewing progress" 
ON public.viewing_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_portfolio_companies_updated_at
BEFORE UPDATE ON public.portfolio_companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_series_updated_at
BEFORE UPDATE ON public.event_series
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance 
CREATE INDEX idx_user_sessions_category ON public.user_sessions(category);
CREATE INDEX idx_user_sessions_portfolio_company ON public.user_sessions(portfolio_company_id);
CREATE INDEX idx_user_sessions_event_series ON public.user_sessions(event_series_id);
CREATE INDEX idx_user_sessions_tags ON public.user_sessions USING GIN(tags);
CREATE INDEX idx_user_favorites_user_session ON public.user_favorites(user_id, session_id);
CREATE INDEX idx_viewing_progress_user_session ON public.viewing_progress(user_id, session_id);