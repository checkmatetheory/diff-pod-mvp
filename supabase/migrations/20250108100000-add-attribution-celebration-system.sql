-- Migration: Add Attribution Celebration System
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
GRANT EXECUTE ON FUNCTION update_speaker_attribution_stats TO authenticated; 