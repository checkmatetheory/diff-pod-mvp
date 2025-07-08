-- Create events table for the Event Content Diffusion Platform
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  description TEXT,
  next_event_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  branding_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add event_id column to user_sessions to link sessions to events
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

-- Create supporting tables for the diffusion platform
CREATE TABLE public.content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'podcast', 'blog', 'social', 'email'
  title TEXT,
  content_text TEXT,
  audio_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  source TEXT DEFAULT 'recap_page', -- 'recap_page', 'social_share', 'direct'
  attended_status TEXT DEFAULT 'non_attendee', -- 'attendee', 'non_attendee', 'unknown'
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  UNIQUE(email, event_id)
);

CREATE TABLE public.shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'linkedin', 'twitter', 'email', 'copy_link'
  share_url TEXT NOT NULL,
  attribution_text TEXT,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sharer_email TEXT
);

CREATE TABLE public.event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  attended BOOLEAN DEFAULT TRUE,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, email)
);

CREATE TABLE public.diffusion_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'recap_view', 'email_capture', 'share', 'content_view'
  metric_value INTEGER DEFAULT 1,
  platform TEXT, -- for shares: 'linkedin', 'twitter', etc.
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diffusion_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events
CREATE POLICY "Users can manage their own events" 
ON public.events FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for content
CREATE POLICY "Users can manage content for their events" 
ON public.content FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = content.event_id AND user_id = auth.uid())
);

-- Create RLS policies for leads
CREATE POLICY "Users can view leads for their events" 
ON public.leads FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = leads.event_id AND user_id = auth.uid())
);

-- Create RLS policies for shares
CREATE POLICY "Users can view shares for their events" 
ON public.shares FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = shares.event_id AND user_id = auth.uid())
);

-- Create RLS policies for event_attendees
CREATE POLICY "Users can manage attendees for their events" 
ON public.event_attendees FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_attendees.event_id AND user_id = auth.uid())
);

-- Create RLS policies for diffusion_analytics
CREATE POLICY "Users can view analytics for their events" 
ON public.diffusion_analytics FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = diffusion_analytics.event_id AND user_id = auth.uid())
);

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_updated_at
BEFORE UPDATE ON public.content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_subdomain ON public.events(subdomain);
CREATE INDEX idx_events_is_active ON public.events(is_active);
CREATE INDEX idx_user_sessions_event_id ON public.user_sessions(event_id);
CREATE INDEX idx_content_session_id ON public.content(session_id);
CREATE INDEX idx_content_event_id ON public.content(event_id);
CREATE INDEX idx_leads_event_id ON public.leads(event_id);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_shares_event_id ON public.shares(event_id);
CREATE INDEX idx_shares_session_id ON public.shares(session_id);
CREATE INDEX idx_event_attendees_event_id ON public.event_attendees(event_id);
CREATE INDEX idx_diffusion_analytics_event_id ON public.diffusion_analytics(event_id);
CREATE INDEX idx_diffusion_analytics_metric_type ON public.diffusion_analytics(metric_type);

-- Insert demo data
-- Create a demo event
INSERT INTO public.events (name, subdomain, description, next_event_date, user_id)
SELECT 
  'Tech Summit 2024',
  'tech-summit-2024',
  'Annual technology summit showcasing the latest innovations in AI, blockchain, and sustainable tech',
  (now() + interval '1 year'),
  id
FROM auth.users 
LIMIT 1;

-- Get the demo event ID for following inserts
DO $$
DECLARE
    demo_event_id UUID;
    demo_user_id UUID;
BEGIN
    -- Get first user
    SELECT id INTO demo_user_id FROM auth.users LIMIT 1;
    
    -- Get the demo event
    SELECT id INTO demo_event_id FROM public.events WHERE subdomain = 'tech-summit-2024';
    
    -- Insert demo session content
    INSERT INTO public.user_sessions (session_name, user_id, event_id, processing_status, generated_summary, podcast_url, generated_title)
    VALUES 
    (
        'AI Healthcare Revolution',
        demo_user_id,
        demo_event_id,
        'complete',
        'Groundbreaking session on how AI is transforming healthcare with 40% reduction in medical errors. Dr. Sarah Chen from Stanford Medical reveals how machine learning algorithms are revolutionizing diagnostic accuracy and patient outcomes.',
        'https://example.com/audio/ai-healthcare.mp3',
        'AI Healthcare Revolution: 40% Reduction in Medical Errors'
    ),
    (
        'DeFi Market Analysis',
        demo_user_id,
        demo_event_id,
        'complete',
        'Comprehensive analysis of the $100B+ DeFi market and its impact on traditional banking. Expert insights on yield farming, liquidity mining, and the future of decentralized finance.',
        'https://example.com/audio/defi-analysis.mp3',
        'DeFi Revolution: $100B+ Market Reshaping Banking'
    ),
    (
        'Climate Tech Innovations',
        demo_user_id,
        demo_event_id,
        'complete',
        'Revolutionary climate technologies achieving 70% cost reduction in carbon capture. Startup founders present breakthrough solutions for scaling renewable energy and carbon neutrality.',
        'https://example.com/audio/climate-tech.mp3',
        'Climate Tech Breakthrough: 70% Cost Reduction in Carbon Capture'
    );
END $$; 