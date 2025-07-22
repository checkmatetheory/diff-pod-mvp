-- ===================================================================
-- SPEAKER MICROSITE SYSTEM MIGRATION
-- 
-- This migration adds the core tables needed for Diffused's speaker
-- microsite generation and approval system.
-- 
-- Built for: Million dollar scalability & maintainability
-- ===================================================================

-- 1. SPEAKERS TABLE
-- Stores individual speaker information (manually entered or LinkedIn scraped)
CREATE TABLE public.speakers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic speaker info
  full_name TEXT NOT NULL,
  email TEXT,
  linkedin_url TEXT,
  bio TEXT,
  headshot_url TEXT,
  company TEXT,
  job_title TEXT,
  
  -- Auto-generated slug for microsites
  slug TEXT NOT NULL UNIQUE, -- e.g. "sarah-chen" for /speaker/sarah-chen
  
  -- LinkedIn scraping metadata
  linkedin_scraped_at TIMESTAMP WITH TIME ZONE,
  linkedin_data JSONB DEFAULT '{}',
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. SPEAKER MICROSITES TABLE  
-- Links speakers to events and tracks microsite generation/approval status
CREATE TABLE public.speaker_microsites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relationships
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  speaker_id UUID NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL,
  
  -- Microsite configuration
  microsite_url TEXT NOT NULL UNIQUE, -- e.g. "studio.diffused.app/sxsw-2025/sarah-chen"
  custom_cta_text TEXT DEFAULT 'Get Early Access - Register for Next Year!',
  custom_cta_url TEXT,
  
  -- Brand customization (inherits from event, can override)
  brand_colors JSONB DEFAULT '{}', -- {"primary": "#5B9BD5", "accent": "#87CEEB"}
  custom_logo_url TEXT,
  
  -- Approval workflow
  approval_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'needs_revision'
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Publication status
  is_live BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Speaker notifications
  speaker_notified_at TIMESTAMP WITH TIME ZONE,
  speaker_notification_email TEXT,
  
  -- Performance tracking
  total_views INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Ensure one microsite per speaker per event
  UNIQUE(event_id, speaker_id)
);

-- 3. SPEAKER CONTENT TABLE
-- Stores AI-generated content for each speaker microsite
CREATE TABLE public.speaker_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relationships
  microsite_id UUID NOT NULL REFERENCES public.speaker_microsites(id) ON DELETE CASCADE,
  
  -- AI-generated content
  generated_summary TEXT, -- Blog-style summary
  key_quotes JSONB DEFAULT '[]', -- Array of quotable moments
  key_takeaways JSONB DEFAULT '[]', -- Bullet point insights
  social_captions JSONB DEFAULT '{}', -- Platform-specific captions
  
  -- Video clips (FFMPEG generated)
  video_clips JSONB DEFAULT '[]', -- Array of {url, title, duration, timestamp}
  highlight_reel_url TEXT, -- Combined highlight reel
  
  -- AI processing status
  processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'complete', 'failed'
  ai_processing_started_at TIMESTAMP WITH TIME ZONE,
  ai_processing_completed_at TIMESTAMP WITH TIME ZONE,
  processing_error_message TEXT,
  
  -- Generation metadata
  prompt_version TEXT, -- Track which prompts were used
  ai_model_used TEXT DEFAULT 'gpt-4o', -- Track which AI model
  processing_duration_seconds INTEGER,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. ATTRIBUTION TRACKING TABLE
-- Tracks clicks, conversions, and referrals from speaker microsites  
CREATE TABLE public.attribution_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relationships
  microsite_id UUID NOT NULL REFERENCES public.speaker_microsites(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Attribution data
  referral_code TEXT, -- e.g. "sarah-chen" for personal codes
  utm_source TEXT,
  utm_medium TEXT, 
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Event tracking
  event_type TEXT NOT NULL, -- 'view', 'click', 'conversion', 'share', 'email_capture'
  conversion_value DECIMAL(10,2), -- For tracking revenue attribution
  conversion_type TEXT, -- 'ticket_purchase', 'lead_signup', 'product_purchase'
  
  -- Technical tracking
  visitor_ip TEXT,
  user_agent TEXT,
  referrer_url TEXT,
  session_id TEXT, -- Frontend session ID
  
  -- Geographic data
  country_code TEXT,
  city TEXT,
  
  -- Audit fields
  tracked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Index for fast lookups
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. MICROSITE APPROVAL HISTORY TABLE
-- Track approval workflow changes for audit/debugging
CREATE TABLE public.microsite_approval_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relationships
  microsite_id UUID NOT NULL REFERENCES public.speaker_microsites(id) ON DELETE CASCADE,
  
  -- Approval change
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  change_reason TEXT,
  
  -- Audit fields
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===================================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================================

-- Speakers table indexes
CREATE INDEX idx_speakers_slug ON public.speakers(slug);
CREATE INDEX idx_speakers_email ON public.speakers(email);
CREATE INDEX idx_speakers_created_by ON public.speakers(created_by);

-- Speaker microsites table indexes  
CREATE INDEX idx_speaker_microsites_event_id ON public.speaker_microsites(event_id);
CREATE INDEX idx_speaker_microsites_speaker_id ON public.speaker_microsites(speaker_id);
CREATE INDEX idx_speaker_microsites_approval_status ON public.speaker_microsites(approval_status);
CREATE INDEX idx_speaker_microsites_is_live ON public.speaker_microsites(is_live);
CREATE INDEX idx_speaker_microsites_url ON public.speaker_microsites(microsite_url);

-- Speaker content table indexes
CREATE INDEX idx_speaker_content_microsite_id ON public.speaker_content(microsite_id);
CREATE INDEX idx_speaker_content_processing_status ON public.speaker_content(processing_status);

-- Attribution tracking table indexes
CREATE INDEX idx_attribution_tracking_microsite_id ON public.attribution_tracking(microsite_id);
CREATE INDEX idx_attribution_tracking_event_id ON public.attribution_tracking(event_id);
CREATE INDEX idx_attribution_tracking_event_type ON public.attribution_tracking(event_type);
CREATE INDEX idx_attribution_tracking_tracked_at ON public.attribution_tracking(tracked_at);
CREATE INDEX idx_attribution_tracking_referral_code ON public.attribution_tracking(referral_code);

-- Approval history table indexes
CREATE INDEX idx_microsite_approval_history_microsite_id ON public.microsite_approval_history(microsite_id);
CREATE INDEX idx_microsite_approval_history_changed_at ON public.microsite_approval_history(changed_at);

-- ===================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================================

-- Enable RLS on all tables
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaker_microsites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaker_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribution_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microsite_approval_history ENABLE ROW LEVEL SECURITY;

-- Speakers policies
CREATE POLICY "Users can manage their own speakers"
ON public.speakers FOR ALL
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Speaker microsites policies
CREATE POLICY "Users can manage microsites for their events"
ON public.speaker_microsites FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = speaker_microsites.event_id 
    AND events.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = speaker_microsites.event_id 
    AND events.user_id = auth.uid()
  )
);

-- Speaker content policies
CREATE POLICY "Users can manage content for their microsites"
ON public.speaker_content FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.speaker_microsites
    JOIN public.events ON events.id = speaker_microsites.event_id
    WHERE speaker_microsites.id = speaker_content.microsite_id
    AND events.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.speaker_microsites
    JOIN public.events ON events.id = speaker_microsites.event_id
    WHERE speaker_microsites.id = speaker_content.microsite_id
    AND events.user_id = auth.uid()
  )
);

-- Attribution tracking policies
CREATE POLICY "Users can view attribution for their events"
ON public.attribution_tracking FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = attribution_tracking.event_id
    AND events.user_id = auth.uid()
  )
);

-- Public can insert attribution data (for tracking external visitors)
CREATE POLICY "Public can insert attribution tracking"
ON public.attribution_tracking FOR INSERT
WITH CHECK (true);

-- Approval history policies
CREATE POLICY "Users can view approval history for their microsites"
ON public.microsite_approval_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.speaker_microsites
    JOIN public.events ON events.id = speaker_microsites.event_id
    WHERE speaker_microsites.id = microsite_approval_history.microsite_id
    AND events.user_id = auth.uid()
  )
);

-- Only event owners can update approval history
CREATE POLICY "Users can manage approval history for their microsites"
ON public.microsite_approval_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.speaker_microsites
    JOIN public.events ON events.id = speaker_microsites.event_id
    WHERE speaker_microsites.id = microsite_approval_history.microsite_id
    AND events.user_id = auth.uid()
  )
);

-- ===================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ===================================================================

-- Updated at triggers
CREATE TRIGGER update_speakers_updated_at
BEFORE UPDATE ON public.speakers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_speaker_microsites_updated_at
BEFORE UPDATE ON public.speaker_microsites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_speaker_content_updated_at
BEFORE UPDATE ON public.speaker_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ===================================================================
-- HELPER FUNCTIONS
-- ===================================================================

-- Function to generate unique speaker slug
CREATE OR REPLACE FUNCTION public.generate_speaker_slug(speaker_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Create base slug from name
  base_slug := lower(trim(regexp_replace(speaker_name, '[^a-zA-Z0-9\s]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append number if needed
  WHILE EXISTS (SELECT 1 FROM public.speakers WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to generate microsite URL
CREATE OR REPLACE FUNCTION public.generate_microsite_url(event_subdomain TEXT, speaker_slug TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'studio.diffused.app/event/' || event_subdomain || '/speaker/' || speaker_slug;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- DEMO DATA (Remove in production)
-- ===================================================================

-- This will be helpful for testing the microsite system
INSERT INTO public.speakers (full_name, email, bio, slug, created_by)
VALUES (
  'Sarah Chen',
  'sarah.chen@example.com', 
  'VP of Engineering at CloudScale Technologies with 10+ years of experience building distributed systems.',
  'sarah-chen',
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Marcus Rodriguez', 
  'marcus@neuraldynamics.ai',
  'Founder & CEO of Neural Dynamics, leading breakthroughs in autonomous AI systems.',
  'marcus-rodriguez',
  (SELECT id FROM auth.users LIMIT 1)  
),
(
  'Dr. Priya Patel',
  'priya.patel@quantumtech.com',
  'Chief Technology Officer at Quantum Computing Labs, pioneering quantum algorithm development.',
  'priya-patel', 
  (SELECT id FROM auth.users LIMIT 1)
);

-- Note: Demo microsite creation would require existing events
-- This should be run after events are created in demo data migration 