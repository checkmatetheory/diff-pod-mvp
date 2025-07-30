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
END $$; -- Migration: Add Attribution Celebration System
-- Created: 2025-01-08
-- Description: Add tables for conversion celebrations, speaker attribution stats, and referral codes

-- Create conversion celebrations table
CREATE TABLE public.conversion_celebrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  speaker_id UUID REFERENCES public.speakers(id) ON DELETE SET NULL,
  microsite_id UUID REFERENCES public.speaker_microsites(id) ON DELETE SET NULL,
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('conversion', 'email_capture', 'registration', 'ticket_purchase')),
  conversion_value NUMERIC DEFAULT 0,
  referral_code TEXT,
  attribution_data JSONB DEFAULT '{}',
  celebrated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create speaker attribution stats table
CREATE TABLE public.speaker_attribution_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  speaker_id UUID NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  total_conversions INTEGER DEFAULT 0,
  total_value NUMERIC DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  first_conversion_at TIMESTAMP WITH TIME ZONE,
  last_conversion_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(speaker_id, event_id)
);

-- Create referral codes table
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  speaker_id UUID REFERENCES public.speakers(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  microsite_id UUID REFERENCES public.speaker_microsites(id) ON DELETE SET NULL,
  code_type TEXT NOT NULL CHECK (code_type IN ('speaker_share', 'event_registration', 'affiliate')),
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  max_uses INTEGER,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral code usage tracking table
CREATE TABLE public.referral_code_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  attribution_tracking_id UUID REFERENCES public.attribution_tracking(id) ON DELETE SET NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  conversion_type TEXT,
  conversion_value NUMERIC DEFAULT 0,
  visitor_ip TEXT,
  user_agent TEXT,
  referrer_url TEXT,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate payouts table (for future use)
CREATE TABLE public.affiliate_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  speaker_id UUID NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  referral_code_id UUID REFERENCES public.referral_codes(id) ON DELETE SET NULL,
  payout_amount NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL,
  total_conversions INTEGER NOT NULL,
  total_conversion_value NUMERIC NOT NULL,
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method TEXT,
  payment_details JSONB DEFAULT '{}',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_conversion_celebrations_event_id ON public.conversion_celebrations(event_id);
CREATE INDEX idx_conversion_celebrations_speaker_id ON public.conversion_celebrations(speaker_id);
CREATE INDEX idx_conversion_celebrations_celebrated_at ON public.conversion_celebrations(celebrated_at);

CREATE INDEX idx_speaker_attribution_stats_speaker_event ON public.speaker_attribution_stats(speaker_id, event_id);
CREATE INDEX idx_speaker_attribution_stats_event_id ON public.speaker_attribution_stats(event_id);

CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_codes_speaker_event ON public.referral_codes(speaker_id, event_id);
CREATE INDEX idx_referral_codes_active ON public.referral_codes(is_active);

CREATE INDEX idx_referral_code_usage_code_id ON public.referral_code_usage(referral_code_id);
CREATE INDEX idx_referral_code_usage_used_at ON public.referral_code_usage(used_at);

CREATE INDEX idx_affiliate_payouts_speaker_event ON public.affiliate_payouts(speaker_id, event_id);
CREATE INDEX idx_affiliate_payouts_status ON public.affiliate_payouts(payout_status);

-- Enable RLS on all tables
ALTER TABLE public.conversion_celebrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaker_attribution_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversion_celebrations
CREATE POLICY "Users can view their event conversion celebrations" ON public.conversion_celebrations
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert conversion celebrations" ON public.conversion_celebrations
  FOR INSERT WITH CHECK (true);

-- RLS Policies for speaker_attribution_stats
CREATE POLICY "Users can view their event speaker attribution stats" ON public.speaker_attribution_stats
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage speaker attribution stats" ON public.speaker_attribution_stats
  FOR ALL USING (true);

-- RLS Policies for referral_codes
CREATE POLICY "Users can view their event referral codes" ON public.referral_codes
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their event referral codes" ON public.referral_codes
  FOR ALL USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for referral_code_usage
CREATE POLICY "Users can view their referral code usage" ON public.referral_code_usage
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can track referral code usage" ON public.referral_code_usage
  FOR INSERT WITH CHECK (true);

-- RLS Policies for affiliate_payouts
CREATE POLICY "Users can view their affiliate payouts" ON public.affiliate_payouts
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their affiliate payouts" ON public.affiliate_payouts
  FOR ALL USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Create function to update speaker attribution stats
CREATE OR REPLACE FUNCTION update_speaker_attribution_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update speaker attribution stats when attribution tracking is inserted
  IF NEW.speaker_id IS NOT NULL AND NEW.event_type IN ('view', 'share', 'click', 'conversion', 'email_capture', 'registration', 'ticket_purchase') THEN
    INSERT INTO public.speaker_attribution_stats (
      speaker_id,
      event_id,
      total_views,
      total_shares,
      total_clicks,
      total_conversions,
      total_value
    )
    VALUES (
      NEW.speaker_id,
      NEW.event_id,
      CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 0 END,
      CASE WHEN NEW.event_type = 'share' THEN 1 ELSE 0 END,
      CASE WHEN NEW.event_type = 'click' THEN 1 ELSE 0 END,
      CASE WHEN NEW.event_type IN ('conversion', 'email_capture', 'registration', 'ticket_purchase') THEN 1 ELSE 0 END,
      COALESCE(NEW.conversion_value, 0)
    )
    ON CONFLICT (speaker_id, event_id) DO UPDATE SET
      total_views = public.speaker_attribution_stats.total_views + 
        CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 0 END,
      total_shares = public.speaker_attribution_stats.total_shares + 
        CASE WHEN NEW.event_type = 'share' THEN 1 ELSE 0 END,
      total_clicks = public.speaker_attribution_stats.total_clicks + 
        CASE WHEN NEW.event_type = 'click' THEN 1 ELSE 0 END,
      total_conversions = public.speaker_attribution_stats.total_conversions + 
        CASE WHEN NEW.event_type IN ('conversion', 'email_capture', 'registration', 'ticket_purchase') THEN 1 ELSE 0 END,
      total_value = public.speaker_attribution_stats.total_value + COALESCE(NEW.conversion_value, 0),
      conversion_rate = CASE 
        WHEN (public.speaker_attribution_stats.total_views + CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 0 END) > 0 
        THEN (public.speaker_attribution_stats.total_conversions + CASE WHEN NEW.event_type IN ('conversion', 'email_capture', 'registration', 'ticket_purchase') THEN 1 ELSE 0 END)::NUMERIC / 
             (public.speaker_attribution_stats.total_views + CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 0 END)::NUMERIC * 100
        ELSE 0 
      END,
      last_conversion_at = CASE 
        WHEN NEW.event_type IN ('conversion', 'email_capture', 'registration', 'ticket_purchase') 
        THEN now() 
        ELSE public.speaker_attribution_stats.last_conversion_at 
      END,
      first_conversion_at = CASE 
        WHEN NEW.event_type IN ('conversion', 'email_capture', 'registration', 'ticket_purchase') AND public.speaker_attribution_stats.first_conversion_at IS NULL
        THEN now() 
        ELSE public.speaker_attribution_stats.first_conversion_at 
      END,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attribution tracking
CREATE TRIGGER trigger_update_speaker_attribution_stats
  AFTER INSERT ON public.attribution_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_speaker_attribution_stats();

-- Create function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code(
  p_speaker_id UUID,
  p_event_id UUID,
  p_code_type TEXT DEFAULT 'speaker_share'
) RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  short_event_id TEXT;
  short_speaker_id TEXT;
  timestamp_str TEXT;
  random_str TEXT;
  final_code TEXT;
BEGIN
  -- Set prefix based on type
  prefix := CASE 
    WHEN p_code_type = 'speaker_share' THEN 'SPK'
    WHEN p_code_type = 'event_registration' THEN 'REG'
    ELSE 'AFF'
  END;

  -- Generate short IDs
  short_event_id := UPPER(SUBSTRING(p_event_id::TEXT, 1, 8));
  short_speaker_id := UPPER(SUBSTRING(p_speaker_id::TEXT, 1, 8));
  
  -- Generate timestamp and random components
  timestamp_str := UPPER(SUBSTRING(EXTRACT(EPOCH FROM NOW())::TEXT, -6));
  random_str := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 3));
  
  -- Combine all parts
  final_code := prefix || '-' || short_event_id || '-' || short_speaker_id || '-' || timestamp_str || random_str;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Create view for attribution analytics
CREATE OR REPLACE VIEW attribution_analytics AS
SELECT 
  event_id,
  speaker_id,
  utm_source,
  utm_medium,
  utm_campaign,
  COUNT(*) as total_events,
  COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views,
  COUNT(CASE WHEN event_type = 'share' THEN 1 END) as shares,
  COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks,
  COUNT(CASE WHEN event_type IN ('conversion', 'email_capture', 'registration', 'ticket_purchase') THEN 1 END) as conversions,
  SUM(COALESCE(conversion_value, 0)) as total_value,
  CASE 
    WHEN COUNT(CASE WHEN event_type = 'view' THEN 1 END) > 0 
    THEN COUNT(CASE WHEN event_type IN ('conversion', 'email_capture', 'registration', 'ticket_purchase') THEN 1 END)::NUMERIC / COUNT(CASE WHEN event_type = 'view' THEN 1 END)::NUMERIC * 100
    ELSE 0 
  END as conversion_rate
FROM public.attribution_tracking
GROUP BY event_id, speaker_id, utm_source, utm_medium, utm_campaign;

-- Grant permissions
GRANT SELECT ON attribution_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION generate_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION update_speaker_attribution_stats TO authenticated; -- Migration: Add Demo Data for Testing
-- Created: 2025-01-08
-- Description: Populate the system with comprehensive sample data for testing all features

-- Note: This migration creates demo data for testing purposes
-- In production, you may want to remove or modify this data

-- Insert demo events
INSERT INTO public.events (id, name, subdomain, description, next_event_date, is_active, branding_config, user_id) VALUES
-- Assuming we have a demo user, we'll use a placeholder user_id that should be replaced with actual test user
('550e8400-e29b-41d4-a716-446655440001', 
 'Tech Summit 2024', 
 'tech-summit-2024', 
 'The premier technology conference featuring industry leaders sharing insights on AI, blockchain, and the future of tech.', 
 '2024-12-15 09:00:00+00',
 true,
 '{"primary_color": "#5B9BD5", "secondary_color": "#4A8BC2", "logo_url": null, "cta_text": "Register for Tech Summit 2025", "cta_url": "https://techsummit.example.com/register"}',
 'auth.uid()'),

('550e8400-e29b-41d4-a716-446655440002',
 'AI Revolution Conference',
 'ai-revolution-2024',
 'Exploring the transformative power of artificial intelligence across industries with top AI researchers and practitioners.',
 '2025-03-20 10:00:00+00',
 true,
 '{"primary_color": "#10b981", "secondary_color": "#047857", "logo_url": null, "cta_text": "Join AI Revolution 2025", "cta_url": "https://airevolution.example.com/tickets"}',
 'auth.uid()'),

('550e8400-e29b-41d4-a716-446655440003',
 'Startup Accelerator Demo Day',
 'startup-demo-day-2024',
 'Watch the next generation of startups pitch their revolutionary ideas to investors and industry experts.',
 '2024-11-30 14:00:00+00',
 true,
 '{"primary_color": "#f97316", "secondary_color": "#ea580c", "logo_url": null, "cta_text": "Apply for Next Cohort", "cta_url": "https://startupaccelerator.example.com/apply"}',
 'auth.uid()');

-- Insert demo speakers
INSERT INTO public.speakers (id, full_name, email, bio, headshot_url, company, job_title, linkedin_url, twitter_handle, slug) VALUES
('550e8400-e29b-41d4-a716-446655440101',
 'Sarah Chen',
 'sarah.chen@example.com',
 'Sarah is the Chief Technology Officer at CloudScale Technologies, where she leads innovation in distributed systems and AI infrastructure. With over 15 years of experience, she has built systems that serve millions of users worldwide.',
 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
 'CloudScale Technologies',
 'Chief Technology Officer',
 'https://linkedin.com/in/sarahchen-cto',
 '@sarahchen_tech',
 'sarah-chen'),

('550e8400-e29b-41d4-a716-446655440102',
 'Marcus Rodriguez',
 'marcus.rodriguez@example.com',
 'Marcus is a serial entrepreneur and AI researcher who has founded three successful startups in the machine learning space. He currently serves as CEO of Neural Dynamics, a company building the next generation of autonomous AI systems.',
 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
 'Neural Dynamics',
 'CEO & Founder',
 'https://linkedin.com/in/marcusrodriguez-ai',
 '@marcusrodriguez',
 'marcus-rodriguez'),

('550e8400-e29b-41d4-a716-446655440103',
 'Dr. Priya Sharma',
 'priya.sharma@example.com',
 'Dr. Sharma is a renowned computer science researcher specializing in quantum computing and cryptography. She leads the Quantum Computing Lab at MIT and has published over 50 papers in top-tier journals.',
 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
 'MIT Quantum Computing Lab',
 'Professor & Lab Director',
 'https://linkedin.com/in/priyasharma-quantum',
 '@priyasharma_quantum',
 'priya-sharma'),

('550e8400-e29b-41d4-a716-446655440104',
 'James Thompson',
 'james.thompson@example.com',
 'James is the VP of Engineering at DataFlow Inc., where he oversees the development of real-time analytics platforms. His expertise spans from distributed systems to user experience design.',
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
 'DataFlow Inc.',
 'VP of Engineering',
 'https://linkedin.com/in/jamesthompson-eng',
 '@jamesthompson_dev',
 'james-thompson'),

('550e8400-e29b-41d4-a716-446655440105',
 'Lisa Wang',
 'lisa.wang@example.com',
 'Lisa is a fintech innovator and the founder of PayTech Solutions. She has revolutionized digital payments across emerging markets and speaks frequently about financial inclusion.',
 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
 'PayTech Solutions',
 'Founder & CEO',
 'https://linkedin.com/in/lisawang-fintech',
 '@lisawang_fintech',
 'lisa-wang');

-- Insert demo speaker microsites
INSERT INTO public.speaker_microsites (id, event_id, speaker_id, microsite_url, custom_cta_text, custom_cta_url, brand_colors, custom_logo_url, approval_status, is_live, total_views, total_shares, approved_by, approved_at, published_at) VALUES
('550e8400-e29b-41d4-a716-446655440201',
 '550e8400-e29b-41d4-a716-446655440001',
 '550e8400-e29b-41d4-a716-446655440101',
 'sarah-chen-tech-summit',
 'Register for Tech Summit 2025',
 'https://techsummit.example.com/register',
 '{"primary": "#5B9BD5", "accent": "#4A8BC2"}',
 null,
 'approved',
 true,
 1247,
 89,
 'auth.uid()',
 now() - interval '2 days',
 now() - interval '2 days'),

('550e8400-e29b-41d4-a716-446655440202',
 '550e8400-e29b-41d4-a716-446655440002',
 '550e8400-e29b-41d4-a716-446655440102',
 'marcus-rodriguez-ai-revolution',
 'Join AI Revolution 2025',
 'https://airevolution.example.com/tickets',
 '{"primary": "#10b981", "accent": "#047857"}',
 null,
 'approved',
 true,
 856,
 67,
 'auth.uid()',
 now() - interval '1 day',
 now() - interval '1 day'),

('550e8400-e29b-41d4-a716-446655440203',
 '550e8400-e29b-41d4-a716-446655440001',
 '550e8400-e29b-41d4-a716-446655440103',
 'priya-sharma-tech-summit',
 'Learn About Quantum Computing',
 'https://quantumcomputing.example.com/course',
 '{"primary": "#5B9BD5", "accent": "#4A8BC2"}',
 null,
 'approved',
 true,
 2156,
 134,
 'auth.uid()',
 now() - interval '3 days',
 now() - interval '3 days'),

('550e8400-e29b-41d4-a716-446655440204',
 '550e8400-e29b-41d4-a716-446655440003',
 '550e8400-e29b-41d4-a716-446655440104',
 'james-thompson-startup-demo',
 'Apply for Next Cohort',
 'https://startupaccelerator.example.com/apply',
 '{"primary": "#f97316", "accent": "#ea580c"}',
 null,
 'pending',
 false,
 0,
 0,
 null,
 null,
 null),

('550e8400-e29b-41d4-a716-446655440205',
 '550e8400-e29b-41d4-a716-446655440002',
 '550e8400-e29b-41d4-a716-446655440105',
 'lisa-wang-ai-revolution',
 'Explore AI in Fintech',
 'https://fintech-ai.example.com/summit',
 '{"primary": "#10b981", "accent": "#047857"}',
 null,
 'approved',
 true,
 692,
 43,
 'auth.uid()',
 now() - interval '12 hours',
 now() - interval '12 hours');

-- Insert demo speaker content
INSERT INTO public.speaker_content (id, microsite_id, generated_summary, key_quotes, key_takeaways, video_clips, highlight_reel_url, processing_status) VALUES
('550e8400-e29b-41d4-a716-446655440301',
 '550e8400-e29b-41d4-a716-446655440201',
 'Sarah Chen delivered an insightful presentation on the evolution of cloud infrastructure and its impact on modern software development. She discussed how distributed systems have transformed from simple client-server architectures to complex microservices ecosystems that can scale to serve billions of users. Her talk covered key architectural patterns, real-world case studies from CloudScale Technologies, and predictions for the future of cloud computing including edge computing, serverless architectures, and AI-driven infrastructure optimization.',
 '["The future of infrastructure is not just about scale, but about intelligent adaptation to user needs.", "We are moving from reactive systems to predictive infrastructure that anticipates demand.", "The biggest challenge in distributed systems is not the technology, but managing complexity at scale.", "Every startup should think about global scale from day one, even if they are serving just local customers."]',
 '["Microservices architecture enables teams to move faster but requires strong DevOps practices", "Edge computing will become critical for low-latency applications", "AI-driven infrastructure optimization can reduce costs by 30-40%", "Container orchestration is essential for modern cloud deployments", "Observability must be built into systems from the beginning"]',
 '[{"url": "https://example.com/video/sarah-chen-1.mp4", "title": "The Evolution of Cloud Architecture", "duration": 120, "timestamp": 300}, {"url": "https://example.com/video/sarah-chen-2.mp4", "title": "Scaling to Billions of Users", "duration": 180, "timestamp": 1200}, {"url": "https://example.com/video/sarah-chen-3.mp4", "title": "Future of Infrastructure", "duration": 150, "timestamp": 2100}]',
 'https://example.com/video/sarah-chen-highlights.mp4',
 'complete'),

('550e8400-e29b-41d4-a716-446655440302',
 '550e8400-e29b-41d4-a716-446655440202',
 'Marcus Rodriguez presented a compelling vision for the future of autonomous AI systems and their potential to revolutionize industries. His talk explored the current state of AI research, breakthrough developments in neural architecture, and the practical challenges of deploying AI systems in production environments. He shared insights from building Neural Dynamics and discussed the ethical considerations that must guide AI development as these systems become more capable and autonomous.',
 '["AI is not about replacing humans, but about amplifying human capabilities in ways we never imagined.", "The next breakthrough in AI will come from systems that can learn continuously and adapt to new environments.", "We need to build AI systems with ethics and transparency as core architectural principles.", "The companies that win in AI will be those that solve real problems, not just impressive demos."]',
 '["Continuous learning systems outperform static models in dynamic environments", "Ethical AI requires diverse teams and inclusive design processes", "Production AI systems need robust monitoring and explainability", "The AI talent shortage requires creative approaches to team building", "Open source AI tools are democratizing innovation"]',
 '[{"url": "https://example.com/video/marcus-rodriguez-1.mp4", "title": "The Future of Autonomous AI", "duration": 200, "timestamp": 180}, {"url": "https://example.com/video/marcus-rodriguez-2.mp4", "title": "Building Neural Dynamics", "duration": 160, "timestamp": 1500}, {"url": "https://example.com/video/marcus-rodriguez-3.mp4", "title": "Ethics in AI Development", "duration": 140, "timestamp": 2200}]',
 'https://example.com/video/marcus-rodriguez-highlights.mp4',
 'complete'),

('550e8400-e29b-41d4-a716-446655440303',
 '550e8400-e29b-41d4-a716-446655440203',
 'Dr. Priya Sharma provided a fascinating deep dive into quantum computing and its potential to solve previously intractable problems. She explained quantum principles in accessible terms, demonstrated current quantum algorithms, and discussed the timeline for quantum advantage in various domains including cryptography, optimization, and drug discovery. Her presentation also addressed the challenges of quantum error correction and the race to build fault-tolerant quantum computers.',
 '["Quantum computing is not just faster computing, it is fundamentally different computing.", "We are still in the early days of quantum - think of where classical computers were in the 1940s.", "The quantum advantage will first appear in very specific problem domains, not general computing.", "Every organization should start thinking about quantum-safe cryptography today."]',
 '["Quantum computers excel at optimization and simulation problems", "Quantum cryptography will revolutionize information security", "Current quantum computers are noisy and limited but rapidly improving", "Quantum algorithms require entirely different programming paradigms", "The quantum workforce needs interdisciplinary skills combining physics and computer science"]',
 '[{"url": "https://example.com/video/priya-sharma-1.mp4", "title": "Quantum Computing Fundamentals", "duration": 190, "timestamp": 240}, {"url": "https://example.com/video/priya-sharma-2.mp4", "title": "Quantum Algorithms in Practice", "duration": 170, "timestamp": 1300}, {"url": "https://example.com/video/priya-sharma-3.mp4", "title": "The Future of Quantum", "duration": 160, "timestamp": 2000}]',
 'https://example.com/video/priya-sharma-highlights.mp4',
 'complete'),

('550e8400-e29b-41d4-a716-446655440304',
 '550e8400-e29b-41d4-a716-446655440205',
 'Lisa Wang shared her journey of building PayTech Solutions and how AI is transforming financial services, particularly in emerging markets. She discussed the challenges of financial inclusion, the role of mobile payments in developing economies, and how machine learning is enabling new forms of credit scoring and fraud detection. Her presentation highlighted successful fintech innovations and provided a roadmap for entrepreneurs looking to enter the fintech space.',
 '["Financial inclusion is not just a social good, it is a massive business opportunity.", "AI in fintech is most powerful when it serves the underserved.", "The future of payments is invisible, instant, and intelligent.", "Regulatory compliance is a feature, not a bug, in fintech innovation."]',
 '["Mobile-first design is essential for emerging market fintech", "Alternative data sources enable credit scoring for the unbanked", "Regulatory partnerships accelerate fintech adoption", "AI-powered fraud detection is table stakes for digital payments", "Cross-border payments remain a major opportunity for innovation"]',
 '[{"url": "https://example.com/video/lisa-wang-1.mp4", "title": "Building PayTech Solutions", "duration": 180, "timestamp": 200}, {"url": "https://example.com/video/lisa-wang-2.mp4", "title": "AI in Financial Services", "duration": 155, "timestamp": 1400}, {"url": "https://example.com/video/lisa-wang-3.mp4", "title": "The Future of Fintech", "duration": 145, "timestamp": 1900}]',
 'https://example.com/video/lisa-wang-highlights.mp4',
 'complete');

-- Insert demo attribution tracking data
INSERT INTO public.attribution_tracking (id, microsite_id, event_id, event_type, utm_source, utm_medium, utm_campaign, utm_content, referral_code, visitor_ip, user_agent, referrer_url, session_id, conversion_value, metadata, created_at) VALUES
-- Views for Sarah Chen's microsite
('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', 'view', 'linkedin', 'social', 'tech-summit-speaker-share', 'sarah-chen-post', 'SPK-550E8400-550E8400-T1234ABC', '203.0.113.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'https://linkedin.com', 'sess-001', null, '{"device": "desktop", "location": "San Francisco"}', now() - interval '2 days'),

('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', 'view', 'twitter', 'social', 'tech-summit-speaker-share', 'sarah-chen-tweet', 'SPK-550E8400-550E8400-T5678DEF', '203.0.113.2', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', 'https://twitter.com', 'sess-002', null, '{"device": "mobile", "location": "New York"}', now() - interval '2 days'),

-- Shares from Sarah Chen's microsite
('550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', 'share', 'linkedin', 'social', 'tech-summit-speaker-share', 'sarah-chen-insights', 'SPK-550E8400-550E8400-T9012GHI', '203.0.113.3', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '', 'sess-003', null, '{"shared_content": "cloud_architecture"}', now() - interval '1 day'),

('550e8400-e29b-41d4-a716-446655440404', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', 'click', 'microsite', 'cta', 'tech-summit-speaker-share', 'register-button', 'SPK-550E8400-550E8400-T3456JKL', '203.0.113.4', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '', 'sess-004', 150, '{"cta_type": "registration"}', now() - interval '1 day'),

-- Conversions
('550e8400-e29b-41d4-a716-446655440405', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', 'ticket_purchase', 'microsite', 'cta', 'tech-summit-speaker-share', 'register-button', 'SPK-550E8400-550E8400-T3456JKL', '203.0.113.4', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '', 'sess-004', 299, '{"ticket_type": "early_bird", "email": "john@example.com"}', now() - interval '6 hours'),

('550e8400-e29b-41d4-a716-446655440406', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440002', 'email_capture', 'linkedin', 'social', 'ai-revolution-speaker-share', 'marcus-rodriguez-post', 'SPK-550E8400-550E8400-T7890MNO', '203.0.113.5', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'https://linkedin.com', 'sess-005', 50, '{"email": "sarah@startup.com", "lead_source": "ai_content"}', now() - interval '3 hours'),

('550e8400-e29b-41d4-a716-446655440407', '550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440001', 'registration', 'twitter', 'social', 'tech-summit-speaker-share', 'quantum-computing-tweet', 'SPK-550E8400-550E8400-T1357PQR', '203.0.113.6', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)', 'https://twitter.com', 'sess-006', 199, '{"course_type": "quantum_fundamentals", "email": "engineer@tech.com"}', now() - interval '1 hour');

-- Insert demo conversion celebrations
INSERT INTO public.conversion_celebrations (id, event_id, speaker_id, microsite_id, conversion_type, conversion_value, referral_code, attribution_data, celebrated_at, notification_sent) VALUES
('550e8400-e29b-41d4-a716-446655440501',
 '550e8400-e29b-41d4-a716-446655440001',
 '550e8400-e29b-41d4-a716-446655440101',
 '550e8400-e29b-41d4-a716-446655440201',
 'ticket_purchase',
 299,
 'SPK-550E8400-550E8400-T3456JKL',
 '{"utm_source": "microsite", "utm_medium": "cta", "conversion_path": ["view", "click", "purchase"]}',
 now() - interval '6 hours',
 true),

('550e8400-e29b-41d4-a716-446655440502',
 '550e8400-e29b-41d4-a716-446655440002',
 '550e8400-e29b-41d4-a716-446655440102',
 '550e8400-e29b-41d4-a716-446655440202',
 'email_capture',
 50,
 'SPK-550E8400-550E8400-T7890MNO',
 '{"utm_source": "linkedin", "utm_medium": "social", "conversion_path": ["view", "email_capture"]}',
 now() - interval '3 hours',
 true),

('550e8400-e29b-41d4-a716-446655440503',
 '550e8400-e29b-41d4-a716-446655440001',
 '550e8400-e29b-41d4-a716-446655440103',
 '550e8400-e29b-41d4-a716-446655440203',
 'registration',
 199,
 'SPK-550E8400-550E8400-T1357PQR',
 '{"utm_source": "twitter", "utm_medium": "social", "conversion_path": ["view", "share", "registration"]}',
 now() - interval '1 hour',
 false);

-- Insert demo referral codes
INSERT INTO public.referral_codes (id, code, speaker_id, event_id, microsite_id, code_type, is_active, usage_count, max_uses, expires_at) VALUES
('550e8400-e29b-41d4-a716-446655440601',
 'SPK-550E8400-550E8400-T3456JKL',
 '550e8400-e29b-41d4-a716-446655440101',
 '550e8400-e29b-41d4-a716-446655440001',
 '550e8400-e29b-41d4-a716-446655440201',
 'speaker_share',
 true,
 5,
 null,
 now() + interval '30 days'),

('550e8400-e29b-41d4-a716-446655440602',
 'SPK-550E8400-550E8400-T7890MNO',
 '550e8400-e29b-41d4-a716-446655440102',
 '550e8400-e29b-41d4-a716-446655440002',
 '550e8400-e29b-41d4-a716-446655440202',
 'speaker_share',
 true,
 3,
 100,
 now() + interval '60 days'),

('550e8400-e29b-41d4-a716-446655440603',
 'SPK-550E8400-550E8400-T1357PQR',
 '550e8400-e29b-41d4-a716-446655440103',
 '550e8400-e29b-41d4-a716-446655440001',
 '550e8400-e29b-41d4-a716-446655440203',
 'speaker_share',
 true,
 2,
 50,
 now() + interval '45 days');

-- Insert demo diffusion analytics (for backward compatibility)
INSERT INTO public.diffusion_analytics (id, event_id, session_id, metric_type, metric_value, recorded_at) VALUES
('550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440001', null, 'recap_view', 1247, now() - interval '2 days'),
('550e8400-e29b-41d4-a716-446655440702', '550e8400-e29b-41d4-a716-446655440001', null, 'share', 89, now() - interval '1 day'),
('550e8400-e29b-41d4-a716-446655440703', '550e8400-e29b-41d4-a716-446655440001', null, 'email_capture', 23, now() - interval '6 hours'),
('550e8400-e29b-41d4-a716-446655440704', '550e8400-e29b-41d4-a716-446655440002', null, 'recap_view', 856, now() - interval '1 day'),
('550e8400-e29b-41d4-a716-446655440705', '550e8400-e29b-41d4-a716-446655440002', null, 'share', 67, now() - interval '12 hours'),
('550e8400-e29b-41d4-a716-446655440706', '550e8400-e29b-41d4-a716-446655440002', null, 'email_capture', 18, now() - interval '3 hours'),
('550e8400-e29b-41d4-a716-446655440707', '550e8400-e29b-41d4-a716-446655440003', null, 'recap_view', 234, now() - interval '6 hours'),
('550e8400-e29b-41d4-a716-446655440708', '550e8400-e29b-41d4-a716-446655440003', null, 'share', 12, now() - interval '2 hours');

-- Insert demo microsite approval history
INSERT INTO public.microsite_approval_history (id, microsite_id, previous_status, new_status, changed_by, change_reason, changed_at) VALUES
('550e8400-e29b-41d4-a716-446655440801',
 '550e8400-e29b-41d4-a716-446655440201',
 'pending',
 'approved',
 'auth.uid()',
 'Content looks great, approved for publication',
 now() - interval '2 days'),

('550e8400-e29b-41d4-a716-446655440802',
 '550e8400-e29b-41d4-a716-446655440202',
 'pending',
 'approved',
 'auth.uid()',
 'Excellent AI insights, ready to go live',
 now() - interval '1 day'),

('550e8400-e29b-41d4-a716-446655440803',
 '550e8400-e29b-41d4-a716-446655440203',
 'pending',
 'needs_revision',
 'auth.uid()',
 'Please add more technical details about quantum algorithms',
 now() - interval '4 days'),

('550e8400-e29b-41d4-a716-446655440804',
 '550e8400-e29b-41d4-a716-446655440203',
 'needs_revision',
 'approved',
 'auth.uid()',
 'Revisions look perfect, quantum content is now comprehensive',
 now() - interval '3 days');

-- Update event branding to use proper field name
UPDATE public.events SET branding_config = branding_config WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003'
);

-- Create demo user sessions (if the table exists)
-- Note: This assumes the user_sessions table structure from the existing migrations
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
    INSERT INTO public.user_sessions (id, event_id, session_name, audio_url, processing_status, generated_summary, created_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440901',
     '550e8400-e29b-41d4-a716-446655440001',
     'The Future of Cloud Infrastructure',
     'https://example.com/audio/sarah-chen-session.mp3',
     'complete',
     'Sarah Chen discussed the evolution of cloud infrastructure...',
     now() - interval '2 days'),
    
    ('550e8400-e29b-41d4-a716-446655440902',
     '550e8400-e29b-41d4-a716-446655440002',
     'Building Autonomous AI Systems',
     'https://example.com/audio/marcus-rodriguez-session.mp3',
     'complete',
     'Marcus Rodriguez presented insights on autonomous AI...',
     now() - interval '1 day'),
    
    ('550e8400-e29b-41d4-a716-446655440903',
     '550e8400-e29b-41d4-a716-446655440001',
     'Quantum Computing Frontiers',
     'https://example.com/audio/priya-sharma-session.mp3',
     'complete',
     'Dr. Priya Sharma explored quantum computing advances...',
     now() - interval '3 days');
  END IF;
END
$$; -- Migration: Update Speaker Microsites for Lead Generation Focus
-- Created: 2025-01-08 14:00:00
-- Description: Transform speaker microsites into lead generation machines for next event registration

-- ===================================================================
-- 1. UPDATE DEFAULT CTA TEXT FOR LEAD GENERATION
-- ===================================================================

-- Update existing microsites with generic CTAs to be lead-focused
UPDATE public.speaker_microsites 
SET custom_cta_text = CASE 
  WHEN custom_cta_text = 'Join us next year!' THEN 'Get Early Access - Register for Next Year!'
  WHEN custom_cta_text = 'Get Access' THEN 'Register for Early Bird Access'
  WHEN custom_cta_text IS NULL OR custom_cta_text = '' THEN 'Get Early Access - Register for Next Year!'
  ELSE custom_cta_text -- Keep custom CTAs that organizers have set
END
WHERE is_live = true;

-- ===================================================================
-- 2. ENSURE EVENTS TABLE HAS NEXT EVENT FIELDS
-- ===================================================================

-- Add next event fields if they don't exist (safe if already exists)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS next_event_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_event_registration_url TEXT;

-- Update events with estimated next event dates (for demo purposes)
-- This sets next event to roughly 1 year from creation for existing events
UPDATE public.events 
SET next_event_date = created_at + INTERVAL '1 year',
    next_event_registration_url = CASE 
      WHEN subdomain IS NOT NULL THEN 'https://' || subdomain || '.eventbrite.com'
      ELSE 'https://tickets.example.com'
    END
WHERE next_event_date IS NULL;

-- ===================================================================
-- 3. ADD LEAD CONVERSION TRACKING
-- ===================================================================

-- Add lead conversion type to attribution tracking if not exists
DO $$
BEGIN
  -- Check if the conversion_type column exists and has the right constraints
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attribution_tracking' 
    AND column_name = 'conversion_type'
  ) THEN
    ALTER TABLE public.attribution_tracking 
    ADD COLUMN conversion_type TEXT;
  END IF;
END $$;

-- Add index for lead conversion tracking
CREATE INDEX IF NOT EXISTS idx_attribution_tracking_conversion_type 
ON public.attribution_tracking(conversion_type);

-- ===================================================================
-- 4. UPDATE DEMO DATA FOR LEAD GENERATION
-- ===================================================================

-- Update demo events with realistic next event dates and registration URLs
UPDATE public.events 
SET 
  next_event_date = CASE 
    WHEN subdomain = 'tech-summit-2024' THEN '2025-11-15 09:00:00+00'::timestamptz
    WHEN subdomain = 'ai-revolution-2024' THEN '2025-03-20 10:00:00+00'::timestamptz
    WHEN subdomain = 'startup-demo-day-2024' THEN '2025-05-30 14:00:00+00'::timestamptz
    ELSE created_at + INTERVAL '1 year'
  END,
  next_event_registration_url = CASE 
    WHEN subdomain = 'tech-summit-2024' THEN 'https://techsummit2025.eventbrite.com'
    WHEN subdomain = 'ai-revolution-2024' THEN 'https://airevolution2025.eventbrite.com'
    WHEN subdomain = 'startup-demo-day-2024' THEN 'https://startupday2025.eventbrite.com'
    ELSE 'https://' || subdomain || '.eventbrite.com'
  END
WHERE subdomain IN ('tech-summit-2024', 'ai-revolution-2024', 'startup-demo-day-2024');

-- Update existing demo microsites with lead-focused CTAs
UPDATE public.speaker_microsites 
SET custom_cta_text = CASE 
  WHEN EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = speaker_microsites.event_id 
    AND events.subdomain = 'tech-summit-2024'
  ) THEN 'Register for Tech Summit 2025'
  WHEN EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = speaker_microsites.event_id 
    AND events.subdomain = 'ai-revolution-2024'
  ) THEN 'Join AI Revolution 2025'
  WHEN EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = speaker_microsites.event_id 
    AND events.subdomain = 'startup-demo-day-2024'
  ) THEN 'Apply for Next Cohort'
  ELSE 'Get Early Access - Register for Next Year!'
END
WHERE is_live = true;

-- ===================================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- ===================================================================

COMMENT ON COLUMN public.speaker_microsites.custom_cta_text IS 'Lead generation focused CTA text. Should drive registration for next event.';
COMMENT ON COLUMN public.speaker_microsites.custom_cta_url IS 'URL for next event registration or waitlist signup.';
COMMENT ON COLUMN public.events.next_event_date IS 'Date of the next/upcoming event for lead generation.';
COMMENT ON COLUMN public.events.next_event_registration_url IS 'Registration URL for the next event.';

-- ===================================================================
-- 6. CREATE HELPER FUNCTION FOR LEAD GENERATION CTAs
-- ===================================================================

-- Function to generate smart lead generation CTA text based on event and timing
CREATE OR REPLACE FUNCTION public.generate_lead_cta_text(
  event_name TEXT,
  next_event_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  time_until_event INTERVAL;
BEGIN
  -- Get the year for the next event
  IF next_event_date IS NOT NULL THEN
    year_suffix := EXTRACT(year FROM next_event_date)::TEXT;
    time_until_event := next_event_date - NOW();
  ELSE
    year_suffix := (EXTRACT(year FROM NOW()) + 1)::TEXT;
  END IF;

  -- Generate context-aware CTA text
  IF next_event_date IS NOT NULL AND time_until_event > INTERVAL '6 months' THEN
    RETURN 'Get Early Bird Access to ' || event_name || ' ' || year_suffix;
  ELSIF next_event_date IS NOT NULL AND time_until_event > INTERVAL '1 month' THEN
    RETURN 'Register for ' || event_name || ' ' || year_suffix;
  ELSIF next_event_date IS NOT NULL AND time_until_event > INTERVAL '0 days' THEN
    RETURN 'Last Chance - Register for ' || event_name || ' ' || year_suffix;
  ELSE
    RETURN 'Join the Waitlist for ' || event_name || ' ' || year_suffix;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Example usage comment
COMMENT ON FUNCTION public.generate_lead_cta_text IS 'Generates contextual CTA text based on event timing. Use: SELECT generate_lead_cta_text(''Tech Summit'', ''2025-11-15''::timestamptz);';

-- ===================================================================
-- 7. UPDATE BRANDING CONFIG FOR LEAD GENERATION
-- ===================================================================

-- Update event branding to include lead generation focused CTAs
UPDATE public.events 
SET branding = jsonb_set(
  COALESCE(branding, '{}'::jsonb),
  '{cta_text}',
  to_jsonb(
    CASE 
      WHEN name IS NOT NULL AND next_event_date IS NOT NULL THEN
        public.generate_lead_cta_text(name, next_event_date)
      ELSE 
        '"Get Early Access - Register for Next Year!"'
    END
  )
)
WHERE branding IS NULL OR NOT (branding ? 'cta_text');

-- Set registration URLs in branding if not set
UPDATE public.events 
SET branding = jsonb_set(
  COALESCE(branding, '{}'::jsonb),
  '{cta_url}',
  to_jsonb(COALESCE(next_event_registration_url, 'https://example.com/register'))
)
WHERE next_event_registration_url IS NOT NULL 
AND (branding IS NULL OR NOT (branding ? 'cta_url'));

-- ===================================================================
-- SUMMARY
-- ===================================================================

-- This migration transforms the speaker microsite system into a lead generation machine:
-- 1. ✅ Updated all CTA text to be lead-generation focused
-- 2. ✅ Added next event date and registration URL fields
-- 3. ✅ Enhanced attribution tracking for lead conversions
-- 4. ✅ Created smart CTA generation function
-- 5. ✅ Updated demo data with realistic next event information
-- 6. ✅ Added proper documentation and comments

-- Next steps for maximum lead generation:
-- - Event organizers should set specific next_event_date and next_event_registration_url
-- - Use the generate_lead_cta_text() function for dynamic CTAs
-- - Track lead conversions in attribution_tracking with conversion_type = 'lead_signup'
-- - Monitor speaker microsite → registration conversion rates -- Add video processing support to user_sessions table
-- This migration adds columns to track AI video processing jobs and their results

-- Add columns for video processing job tracking
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS video_processing_job_id TEXT,
ADD COLUMN IF NOT EXISTS video_processing_status TEXT CHECK (video_processing_status IN ('submitted', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS video_processing_error TEXT,
ADD COLUMN IF NOT EXISTS video_processing_provider TEXT DEFAULT 'vizard',
ADD COLUMN IF NOT EXISTS video_processing_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS video_processing_completed_at TIMESTAMPTZ;

-- Create index for efficient querying of video processing jobs
CREATE INDEX IF NOT EXISTS idx_user_sessions_video_processing_job_id 
ON user_sessions(video_processing_job_id) 
WHERE video_processing_job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_sessions_video_processing_status 
ON user_sessions(video_processing_status) 
WHERE video_processing_status IS NOT NULL;

-- Create table for storing generated video clips
CREATE TABLE IF NOT EXISTS video_clips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
    clip_id TEXT NOT NULL, -- External ID from AI provider
    provider_job_id TEXT NOT NULL, -- Job ID from AI provider
    
    -- Video Properties
    title TEXT NOT NULL,
    duration INTEGER NOT NULL, -- seconds
    aspect_ratio TEXT NOT NULL DEFAULT '9:16',
    quality TEXT NOT NULL DEFAULT '1080p',
    
    -- File URLs
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    -- AI Analysis
    virality_score INTEGER CHECK (virality_score >= 0 AND virality_score <= 100),
    virality_reasoning TEXT,
    transcript TEXT,
    
    -- Content Metadata
    event_name TEXT,
    speaker_name TEXT,
    
    -- Publishing
    suggested_caption TEXT,
    suggested_hashtags TEXT[], -- Array of hashtag strings
    
    -- Workflow State
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('processing', 'ready', 'published', 'failed')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    
    -- Publishing tracking (JSONB for flexibility)
    published_to JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    UNIQUE(session_id, clip_id, provider_job_id)
);

-- Create indexes for video_clips table
CREATE INDEX IF NOT EXISTS idx_video_clips_session_id ON video_clips(session_id);
CREATE INDEX IF NOT EXISTS idx_video_clips_provider_job_id ON video_clips(provider_job_id);
CREATE INDEX IF NOT EXISTS idx_video_clips_status ON video_clips(status);
CREATE INDEX IF NOT EXISTS idx_video_clips_virality_score ON video_clips(virality_score DESC) WHERE virality_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_clips_created_at ON video_clips(created_at DESC);

-- Enable RLS on video_clips table
ALTER TABLE video_clips ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_clips - users can only access clips from their own sessions
CREATE POLICY "Users can view their own video clips" ON video_clips
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM user_sessions 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert video clips for their own sessions" ON video_clips
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM user_sessions 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own video clips" ON video_clips
    FOR UPDATE USING (
        session_id IN (
            SELECT id FROM user_sessions 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own video clips" ON video_clips
    FOR DELETE USING (
        session_id IN (
            SELECT id FROM user_sessions 
            WHERE user_id = auth.uid()
        )
    );

-- Create table for tracking AI processing jobs (for webhook handling and status polling)
CREATE TABLE IF NOT EXISTS ai_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
    provider_job_id TEXT NOT NULL,
    provider_name TEXT NOT NULL DEFAULT 'vizard',
    
    -- Job Configuration
    job_config JSONB NOT NULL, -- Store the original ProcessingJob data
    
    -- Status Tracking
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'processing', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    
    -- Progress Tracking
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    estimated_completion_time INTEGER, -- minutes
    
    -- Results
    clips_generated INTEGER DEFAULT 0,
    total_duration INTEGER, -- total duration of all clips in seconds
    average_virality_score DECIMAL(5,2),
    
    -- Timestamps
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    started_processing_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_status_check_at TIMESTAMPTZ,
    
    -- Metadata
    provider_metadata JSONB DEFAULT '{}'::jsonb,
    webhook_data JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    UNIQUE(provider_job_id, provider_name)
);

-- Create indexes for ai_processing_jobs table
CREATE INDEX IF NOT EXISTS idx_ai_processing_jobs_session_id ON ai_processing_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_jobs_provider_job_id ON ai_processing_jobs(provider_job_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_jobs_status ON ai_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_processing_jobs_provider ON ai_processing_jobs(provider_name);
CREATE INDEX IF NOT EXISTS idx_ai_processing_jobs_submitted_at ON ai_processing_jobs(submitted_at DESC);

-- Enable RLS on ai_processing_jobs table
ALTER TABLE ai_processing_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_processing_jobs
CREATE POLICY "Users can view their own processing jobs" ON ai_processing_jobs
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM user_sessions 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert processing jobs for their own sessions" ON ai_processing_jobs
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM user_sessions 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own processing jobs" ON ai_processing_jobs
    FOR UPDATE USING (
        session_id IN (
            SELECT id FROM user_sessions 
            WHERE user_id = auth.uid()
        )
    );

-- Function to automatically update video_processing_status when ai_processing_jobs status changes
CREATE OR REPLACE FUNCTION update_session_video_processing_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user_sessions table when processing job status changes
    UPDATE user_sessions 
    SET 
        video_processing_status = NEW.status,
        video_processing_completed_at = CASE 
            WHEN NEW.status IN ('completed', 'failed') THEN NOW()
            ELSE video_processing_completed_at
        END
    WHERE id = NEW.session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update session status
DROP TRIGGER IF EXISTS trigger_update_session_video_processing_status ON ai_processing_jobs;
CREATE TRIGGER trigger_update_session_video_processing_status
    AFTER UPDATE OF status ON ai_processing_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_session_video_processing_status();

-- Add helpful comments
COMMENT ON TABLE video_clips IS 'Stores AI-generated video clips from various providers';
COMMENT ON TABLE ai_processing_jobs IS 'Tracks video processing jobs across different AI providers';
COMMENT ON COLUMN video_clips.virality_score IS 'AI-predicted viral potential score (0-100)';
COMMENT ON COLUMN video_clips.suggested_hashtags IS 'Array of hashtag strings without # symbol';
COMMENT ON COLUMN ai_processing_jobs.job_config IS 'Original ProcessingJob configuration as JSON';
COMMENT ON COLUMN ai_processing_jobs.provider_metadata IS 'Provider-specific response data and metadata'; -- Create enum for event categories
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
CREATE INDEX idx_viewing_progress_user_session ON public.viewing_progress(user_id, session_id);-- Simplify event categories enum to just conference and trade_show
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
ALTER COLUMN category SET DEFAULT 'conference';-- First, update existing data to use simplified categories
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
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON public.user_sessions(created_at DESC);-- Add new podcast-specific columns to user_sessions first
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
UPDATE public.user_sessions SET category = 'conference'::event_category;-- Create sponsors table for ad management
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
CREATE INDEX idx_sponsor_placements_session_id ON public.sponsor_placements(session_id);-- Add analytics tracking tables for portfolios
CREATE TABLE public.portfolio_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES public.conference_portfolios(id) ON DELETE CASCADE,
  total_episodes INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,
  total_sponsor_revenue DECIMAL DEFAULT 0.00,
  avg_engagement_rate DECIMAL DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add episode analytics table
CREATE TABLE public.episode_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES public.conference_portfolios(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  engagement_rate DECIMAL DEFAULT 0.00,
  sponsor_revenue DECIMAL DEFAULT 0.00,
  listening_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add website monitoring configuration
CREATE TABLE public.website_monitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES public.conference_portfolios(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  selector_config JSONB, -- CSS selectors for content extraction
  monitoring_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  last_check TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.portfolio_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_monitors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their portfolio analytics" ON public.portfolio_analytics FOR ALL USING (
  EXISTS (SELECT 1 FROM public.conference_portfolios WHERE id = portfolio_analytics.portfolio_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage their episode analytics" ON public.episode_analytics FOR ALL USING (
  EXISTS (SELECT 1 FROM public.conference_portfolios WHERE id = episode_analytics.portfolio_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage their website monitors" ON public.website_monitors FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_episode_analytics_updated_at BEFORE UPDATE ON public.episode_analytics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_website_monitors_updated_at BEFORE UPDATE ON public.website_monitors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_portfolio_analytics_portfolio_id ON public.portfolio_analytics(portfolio_id);
CREATE INDEX idx_episode_analytics_session_id ON public.episode_analytics(session_id);
CREATE INDEX idx_episode_analytics_portfolio_id ON public.episode_analytics(portfolio_id);
CREATE INDEX idx_website_monitors_portfolio_id ON public.website_monitors(portfolio_id);
CREATE INDEX idx_website_monitors_user_id ON public.website_monitors(user_id);-- Create storage buckets for audio/video files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('session-uploads', 'session-uploads', false);

-- Create storage policies for user uploads
CREATE POLICY "Users can upload their own session files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'session-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own session files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'session-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own session files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'session-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own session files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'session-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); -- ===================================================================
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
-- This should be run after events are created in demo data migration -- Migration: Fix Public Access to Speaker Microsites
-- Created: 2025-01-08 13:00:00
-- Description: Enable Row Level Security and create policies to allow public access to live speaker microsites

-- Step 1: Enable Row Level Security on all necessary tables
-- This is safe to run even if RLS is already enabled
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.speaker_microsites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaker_content ENABLE ROW LEVEL SECURITY;

-- Step 2: Create policy to allow public read access to active events
-- This allows fetching event details, branding, etc. for public event pages
DROP POLICY IF EXISTS "Public can view active events" ON public.events;
CREATE POLICY "Public can view active events"
ON public.events FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Step 3: Create policy to allow public read access to all speaker profiles
-- Speaker profiles are generally public information
DROP POLICY IF EXISTS "Public can view speaker profiles" ON public.speakers;
CREATE POLICY "Public can view speaker profiles"
ON public.speakers FOR SELECT
TO anon, authenticated
USING (true);

-- Step 4: Create policy to allow public read access to live and approved microsites
-- This is the main policy that enables public speaker microsite access
DROP POLICY IF EXISTS "Public can view live microsites" ON public.speaker_microsites;
CREATE POLICY "Public can view live microsites"
ON public.speaker_microsites FOR SELECT
TO anon, authenticated
USING (is_live = true AND approval_status = 'approved');

-- Step 5: Create policy to allow public read access to content for live microsites
-- This enables fetching speaker content (summaries, quotes, takeaways) for live microsites
DROP POLICY IF EXISTS "Public can view content for live microsites" ON public.speaker_content;
CREATE POLICY "Public can view content for live microsites"
ON public.speaker_content FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.speaker_microsites sm
    WHERE sm.id = speaker_content.microsite_id
    AND sm.is_live = true
    AND sm.approval_status = 'approved'
  )
);

-- Step 6: Create policy to allow public read access to attribution tracking
-- This enables tracking views and shares on public microsites
ALTER TABLE public.attribution_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can insert attribution tracking" ON public.attribution_tracking;
CREATE POLICY "Public can insert attribution tracking"
ON public.attribution_tracking FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Note: These policies ensure that:
-- 1. Only live and approved speaker microsites are publicly accessible
-- 2. Associated event and speaker data can be fetched for context
-- 3. Content and attribution tracking work for public microsites
-- 4. Private/draft microsites remain protected -- Migration: Add Content Favorites System for Photos and Reels
-- Created: 2025-01-08
-- Description: Add tables for content items (photos/reels) and update favorites system

-- Create content items table for photos and reels
CREATE TABLE public.content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('photo', 'reel')),
  thumbnail_url TEXT NOT NULL,
  content_url TEXT,
  speaker_name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  description TEXT,
  duration INTEGER, -- for reels (in seconds)
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create content favorites table (separate from session favorites)
CREATE TABLE public.content_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_item_id)
);

-- Enable RLS
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for content_items (public read, authenticated users can create)
CREATE POLICY "Anyone can view content items" 
ON public.content_items 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create content items" 
ON public.content_items 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own content items" 
ON public.content_items 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Create RLS policies for content_favorites
CREATE POLICY "Users can view their own content favorites" 
ON public.content_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content favorites" 
ON public.content_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content favorites" 
ON public.content_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_content_items_type ON public.content_items(type);
CREATE INDEX idx_content_items_speaker ON public.content_items(speaker_name);
CREATE INDEX idx_content_items_event ON public.content_items(event_name);
CREATE INDEX idx_content_items_created_at ON public.content_items(created_at DESC);

CREATE INDEX idx_content_favorites_user_content ON public.content_favorites(user_id, content_item_id);
CREATE INDEX idx_content_favorites_user_id ON public.content_favorites(user_id);
CREATE INDEX idx_content_favorites_created_at ON public.content_favorites(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_content_items_updated_at
BEFORE UPDATE ON public.content_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert demo content items matching the Browse page data
INSERT INTO public.content_items (title, type, thumbnail_url, speaker_name, event_name, description) VALUES
('AI Innovation Discussion', 'reel', '/api/placeholder/400/600', 'Dr. Alex Chen', 'Tech Summit 2024', 'Groundbreaking discussion on AI innovation and its impact on technology'),
('Future of Work Panel', 'reel', '/api/placeholder/400/600', 'Sarah Johnson', 'Innovation Conference', 'Panel discussion about remote work and digital transformation'),
('Leadership Workshop', 'photo', '/api/placeholder/400/600', 'Mike Rodriguez', 'Business Summit', 'Interactive workshop on modern leadership principles'),
('Startup Pitch Session', 'reel', '/api/placeholder/400/600', 'Emma Davis', 'Entrepreneur Expo', 'Exciting startup pitches from emerging companies'),
('Panel Discussion', 'photo', '/api/placeholder/400/600', 'Dr. James Wilson', 'Innovation Summit', 'Expert panel on industry trends and insights'),
('Keynote Presentation', 'photo', '/api/placeholder/400/600', 'Lisa Chang', 'Tech Conference', 'Inspiring keynote on technology and innovation'),
('Product Demo', 'reel', '/api/placeholder/400/600', 'David Park', 'Product Summit', 'Live demonstration of cutting-edge products'),
('Networking Session', 'photo', '/api/placeholder/400/600', 'Maria Garcia', 'Business Forum', 'Professional networking and relationship building'),
('Investment Strategy', 'reel', '/api/placeholder/400/600', 'Robert Kim', 'Finance Summit', 'Strategic insights on modern investment approaches'),
('Team Building', 'photo', '/api/placeholder/400/600', 'Jennifer Lopez', 'Leadership Retreat', 'Team building exercises and collaboration techniques'),
('Marketing Insights', 'reel', '/api/placeholder/400/600', 'Kevin Zhang', 'Digital Marketing Expo', 'Latest trends in digital marketing and customer engagement'),
('Innovation Workshop', 'photo', '/api/placeholder/400/600', 'Amanda Taylor', 'Creative Conference', 'Hands-on workshop on innovation and creative thinking'); -- ===================================================================
-- SPEAKER-SESSION RELATIONSHIP OPTIMIZATION MIGRATION
-- 
-- This migration optimizes the speaker-session relationship for scale
-- by introducing a proper junction table and enforcing one microsite 
-- per speaker per event.
--
-- CHANGES:
-- 1. Create speaker_microsite_sessions junction table
-- 2. Backfill data from existing speaker_microsites  
-- 3. Remove session_id from speaker_microsites
-- 4. Add unique constraint on (event_id, speaker_id)
-- 5. Update RLS policies
-- ===================================================================

-- UP MIGRATION
-- =============

-- 1. CREATE JUNCTION TABLE
-- Links speaker microsites to sessions (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.speaker_microsite_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relationships
  microsite_id UUID NOT NULL REFERENCES public.speaker_microsites(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  
  -- Prevent duplicate links
  UNIQUE(microsite_id, session_id),
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. BACKFILL DATA FROM EXISTING SPEAKER_MICROSITES
-- Copy existing session_id relationships to the junction table
INSERT INTO public.speaker_microsite_sessions (microsite_id, session_id, created_by)
SELECT 
  sm.id as microsite_id,
  sm.session_id,
  sm.created_by
FROM public.speaker_microsites sm
WHERE sm.session_id IS NOT NULL;

-- 3. REMOVE SESSION_ID COLUMN FROM SPEAKER_MICROSITES
-- This enforces "one microsite per speaker per event" model
ALTER TABLE public.speaker_microsites 
DROP COLUMN IF EXISTS session_id;

-- 4. ADD UNIQUE CONSTRAINT
-- Ensures one microsite per speaker per event at database level
ALTER TABLE public.speaker_microsites 
DROP CONSTRAINT IF EXISTS speaker_microsites_event_speaker_unique;

ALTER TABLE public.speaker_microsites 
ADD CONSTRAINT speaker_microsites_event_speaker_unique 
UNIQUE (event_id, speaker_id);

-- 5. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_speaker_microsite_sessions_microsite_id 
ON public.speaker_microsite_sessions(microsite_id);

CREATE INDEX IF NOT EXISTS idx_speaker_microsite_sessions_session_id 
ON public.speaker_microsite_sessions(session_id);

CREATE INDEX IF NOT EXISTS idx_speaker_microsites_event_speaker 
ON public.speaker_microsites(event_id, speaker_id);

-- 6. ENABLE RLS ON NEW TABLE
ALTER TABLE public.speaker_microsite_sessions ENABLE ROW LEVEL SECURITY;

-- 7. CREATE RLS POLICIES FOR JUNCTION TABLE
-- Users can see junction records for their own events/sessions
CREATE POLICY "Users can view their speaker-session links" ON public.speaker_microsite_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.speaker_microsites sm
    JOIN public.events e ON e.id = sm.event_id
    WHERE sm.id = microsite_id
    AND e.created_by = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_sessions us
    WHERE us.id = session_id
    AND us.created_by = auth.uid()
  )
);

-- Users can insert junction records for their own events/sessions
CREATE POLICY "Users can create their speaker-session links" ON public.speaker_microsite_sessions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.speaker_microsites sm
    JOIN public.events e ON e.id = sm.event_id
    WHERE sm.id = microsite_id
    AND e.created_by = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 FROM public.user_sessions us
    WHERE us.id = session_id
    AND us.created_by = auth.uid()
  )
);

-- Users can update junction records for their own events/sessions
CREATE POLICY "Users can update their speaker-session links" ON public.speaker_microsite_sessions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.speaker_microsites sm
    JOIN public.events e ON e.id = sm.event_id
    WHERE sm.id = microsite_id
    AND e.created_by = auth.uid()
  )
);

-- Users can delete junction records for their own events/sessions
CREATE POLICY "Users can delete their speaker-session links" ON public.speaker_microsite_sessions
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.speaker_microsites sm
    JOIN public.events e ON e.id = sm.event_id
    WHERE sm.id = microsite_id
    AND e.created_by = auth.uid()
  )
);

-- 8. UPDATE TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_speaker_microsite_sessions_updated_at 
BEFORE UPDATE ON public.speaker_microsite_sessions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DOWN MIGRATION  
-- ==============
-- 
-- UNCOMMENT AND RUN THE FOLLOWING TO REVERSE THIS MIGRATION:
--
-- -- 1. Drop the trigger
-- DROP TRIGGER IF EXISTS update_speaker_microsite_sessions_updated_at ON public.speaker_microsite_sessions;
-- 
-- -- 2. Re-add session_id column to speaker_microsites
-- ALTER TABLE public.speaker_microsites 
-- ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL;
-- 
-- -- 3. Backfill session_id from junction table (use first session if multiple)
-- UPDATE public.speaker_microsites 
-- SET session_id = (
--   SELECT session_id 
--   FROM public.speaker_microsite_sessions sms 
--   WHERE sms.microsite_id = speaker_microsites.id 
--   LIMIT 1
-- );
-- 
-- -- 4. Remove unique constraint
-- ALTER TABLE public.speaker_microsites 
-- DROP CONSTRAINT IF EXISTS speaker_microsites_event_speaker_unique;
-- 
-- -- 5. Drop indexes
-- DROP INDEX IF EXISTS idx_speaker_microsite_sessions_microsite_id;
-- DROP INDEX IF EXISTS idx_speaker_microsite_sessions_session_id;
-- DROP INDEX IF EXISTS idx_speaker_microsites_event_speaker;
-- 
-- -- 6. Drop junction table
-- DROP TABLE IF EXISTS public.speaker_microsite_sessions;

-- MIGRATION COMPLETE
-- ==================
-- 
-- SUMMARY OF CHANGES:
-- ✅ Created speaker_microsite_sessions junction table for scalable many-to-many relationships
-- ✅ Backfilled existing data from speaker_microsites.session_id  
-- ✅ Removed session_id column from speaker_microsites (enforces one microsite per speaker per event)
-- ✅ Added unique constraint on (event_id, speaker_id) for data integrity
-- ✅ Created optimized indexes for query performance
-- ✅ Set up comprehensive RLS policies for security
-- ✅ Added triggers for automatic updated_at timestamps
-- 
-- The "Remove Speaker" functionality should now:
-- 1. Delete the specific session link from speaker_microsite_sessions table
-- 2. Keep the microsite if other sessions exist for the same speaker+event
-- 3. Only delete the microsite if no sessions remain for that speaker+event
--
-- This architecture scales to millions of records while maintaining data integrity. 