-- Migration: Fix Public Access to Speaker Microsites
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
-- 4. Private/draft microsites remain protected 