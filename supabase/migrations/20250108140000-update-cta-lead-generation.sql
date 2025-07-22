-- Migration: Update Speaker Microsites for Lead Generation Focus
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
-- - Monitor speaker microsite → registration conversion rates 