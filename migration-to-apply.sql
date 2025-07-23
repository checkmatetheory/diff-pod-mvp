-- SPEAKER-SESSION OPTIMIZATION MIGRATION
-- Copy and paste this entire file into Supabase SQL Editor and run it

-- 1. CREATE JUNCTION TABLE
CREATE TABLE IF NOT EXISTS public.speaker_microsite_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  microsite_id UUID NOT NULL REFERENCES public.speaker_microsites(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  UNIQUE(microsite_id, session_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. BACKFILL DATA
INSERT INTO public.speaker_microsite_sessions (microsite_id, session_id, created_by)
SELECT sm.id as microsite_id, sm.session_id, sm.created_by
FROM public.speaker_microsites sm
WHERE sm.session_id IS NOT NULL;

-- 3. REMOVE SESSION_ID COLUMN
ALTER TABLE public.speaker_microsites DROP COLUMN IF EXISTS session_id;

-- 4. ADD UNIQUE CONSTRAINT
ALTER TABLE public.speaker_microsites 
DROP CONSTRAINT IF EXISTS speaker_microsites_event_speaker_unique;
ALTER TABLE public.speaker_microsites 
ADD CONSTRAINT speaker_microsites_event_speaker_unique UNIQUE (event_id, speaker_id);

-- 5. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_speaker_microsite_sessions_microsite_id 
ON public.speaker_microsite_sessions(microsite_id);
CREATE INDEX IF NOT EXISTS idx_speaker_microsite_sessions_session_id 
ON public.speaker_microsite_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_speaker_microsites_event_speaker 
ON public.speaker_microsites(event_id, speaker_id);

-- 6. ENABLE RLS
ALTER TABLE public.speaker_microsite_sessions ENABLE ROW LEVEL SECURITY;

-- 7. CREATE RLS POLICIES
CREATE POLICY "Users can view their speaker-session links" ON public.speaker_microsite_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.speaker_microsites sm
    JOIN public.events e ON e.id = sm.event_id
    WHERE sm.id = microsite_id AND e.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_sessions us
    WHERE us.id = session_id AND us.created_by = auth.uid()
  )
);

CREATE POLICY "Users can create their speaker-session links" ON public.speaker_microsite_sessions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.speaker_microsites sm
    JOIN public.events e ON e.id = sm.event_id
    WHERE sm.id = microsite_id AND e.created_by = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.user_sessions us
    WHERE us.id = session_id AND us.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update their speaker-session links" ON public.speaker_microsite_sessions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.speaker_microsites sm
    JOIN public.events e ON e.id = sm.event_id
    WHERE sm.id = microsite_id AND e.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete their speaker-session links" ON public.speaker_microsite_sessions
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.speaker_microsites sm
    JOIN public.events e ON e.id = sm.event_id
    WHERE sm.id = microsite_id AND e.created_by = auth.uid()
  )
);

-- 8. ADD TRIGGER
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