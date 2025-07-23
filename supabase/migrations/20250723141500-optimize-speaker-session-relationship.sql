-- ===================================================================
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