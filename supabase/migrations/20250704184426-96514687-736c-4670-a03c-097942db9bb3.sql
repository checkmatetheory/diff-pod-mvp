-- Create sponsors table for ad management
CREATE TABLE public.sponsors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  ad_script TEXT,
  ad_audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Create custom voices table for voice training/cloning
CREATE TABLE public.custom_voices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  voice_id TEXT, -- ElevenLabs voice ID
  training_audio_url TEXT,
  is_trained BOOLEAN DEFAULT FALSE,
  voice_type TEXT DEFAULT 'host', -- 'host', 'narrator', 'announcer'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Create audio assets table for intro/outro music
CREATE TABLE public.audio_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL, -- 'intro', 'outro', 'transition', 'sponsor_jingle'
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Create conference portfolios table
CREATE TABLE public.conference_portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  brand_logo_url TEXT,
  default_intro_audio_id UUID REFERENCES public.audio_assets(id),
  default_outro_audio_id UUID REFERENCES public.audio_assets(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Create podcast hosts table for multi-host support
CREATE TABLE public.podcast_hosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  voice_id UUID REFERENCES public.custom_voices(id),
  host_role TEXT, -- 'primary', 'secondary', 'interviewer', 'expert'
  speaking_percentage DECIMAL DEFAULT 50.0, -- percentage of speaking time
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sponsor placements table for ad management
CREATE TABLE public.sponsor_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES public.sponsors(id),
  placement_type TEXT NOT NULL, -- 'pre_roll', 'mid_roll', 'post_roll'
  timestamp_seconds INTEGER, -- for mid-roll placements
  duration_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to user_sessions for enterprise features
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS portfolio_id UUID REFERENCES public.conference_portfolios(id),
ADD COLUMN IF NOT EXISTS host_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS sponsor_revenue DECIMAL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS intro_audio_id UUID REFERENCES public.audio_assets(id),
ADD COLUMN IF NOT EXISTS outro_audio_id UUID REFERENCES public.audio_assets(id);

-- Enable RLS on all new tables
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conference_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_placements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sponsors
CREATE POLICY "Users can manage their own sponsors" ON public.sponsors FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for custom_voices
CREATE POLICY "Users can manage their own voices" ON public.custom_voices FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for audio_assets
CREATE POLICY "Users can manage their own audio assets" ON public.audio_assets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for conference_portfolios
CREATE POLICY "Users can manage their own portfolios" ON public.conference_portfolios FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for podcast_hosts (through session ownership)
CREATE POLICY "Users can manage hosts for their sessions" ON public.podcast_hosts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_sessions WHERE id = podcast_hosts.session_id AND user_id = auth.uid())
);

-- Create RLS policies for sponsor_placements (through session ownership)
CREATE POLICY "Users can manage placements for their sessions" ON public.sponsor_placements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_sessions WHERE id = sponsor_placements.session_id AND user_id = auth.uid())
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_sponsors_updated_at BEFORE UPDATE ON public.sponsors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_custom_voices_updated_at BEFORE UPDATE ON public.custom_voices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conference_portfolios_updated_at BEFORE UPDATE ON public.conference_portfolios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_sponsors_user_id ON public.sponsors(user_id);
CREATE INDEX idx_custom_voices_user_id ON public.custom_voices(user_id);
CREATE INDEX idx_audio_assets_user_id_type ON public.audio_assets(user_id, asset_type);
CREATE INDEX idx_conference_portfolios_user_id ON public.conference_portfolios(user_id);
CREATE INDEX idx_podcast_hosts_session_id ON public.podcast_hosts(session_id);
CREATE INDEX idx_sponsor_placements_session_id ON public.sponsor_placements(session_id);