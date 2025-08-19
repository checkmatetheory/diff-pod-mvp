-- Comprehensive Security Fixes Migration
-- Addresses all Supabase Security Advisor warnings with proper secure implementations

-- ===================================================================
-- 1. FIX FUNCTION SEARCH PATH MUTABLE ISSUES
-- ===================================================================

-- All SECURITY DEFINER functions must have explicit search_path to prevent
-- search path injection attacks. This is a critical security requirement.

-- Fix update_session_video_processing_status function
CREATE OR REPLACE FUNCTION update_session_video_processing_status()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update the user_sessions table when processing job status changes
    UPDATE public.user_sessions 
    SET 
        video_processing_status = NEW.status,
        video_processing_completed_at = CASE 
            WHEN NEW.status IN ('completed', 'failed') THEN NOW()
            ELSE video_processing_completed_at
        END
    WHERE id = NEW.session_id;
    
    RETURN NEW;
END;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix generate_speaker_slug function
CREATE OR REPLACE FUNCTION public.generate_speaker_slug()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = lower(
            regexp_replace(
                regexp_replace(NEW.full_name, '[^a-zA-Z0-9\s]', '', 'g'),
                '\s+', '-', 'g'
            )
        );
        
        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM public.speakers WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
            NEW.slug = NEW.slug || '-' || floor(random() * 1000)::text;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Fix generate_microsite_url function
CREATE OR REPLACE FUNCTION public.generate_microsite_url()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
    speaker_slug TEXT;
    event_subdomain TEXT;
BEGIN
    -- Get speaker slug and event subdomain
    SELECT s.slug INTO speaker_slug
    FROM public.speakers s
    WHERE s.id = NEW.speaker_id;
    
    SELECT e.subdomain INTO event_subdomain
    FROM public.events e
    WHERE e.id = NEW.event_id;
    
    -- Generate microsite URL
    NEW.microsite_url = event_subdomain || '.diffused.app/' || speaker_slug;
    
    RETURN NEW;
END;
$$;

-- Fix generate_referral_code function
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code = upper(substring(md5(random()::text) from 1 for 8));
        
        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM public.referral_codes WHERE code = NEW.code) LOOP
            NEW.code = upper(substring(md5(random()::text) from 1 for 8));
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;

-- ===================================================================
-- 2. FIX UPLOAD_SESSIONS RLS CONFIGURATION
-- ===================================================================

-- Ensure upload_sessions has proper RLS configuration
-- The table should be fully secured with proper policies

-- First, ensure RLS is enabled
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own upload sessions" ON public.upload_sessions;
DROP POLICY IF EXISTS "Users can insert their own upload sessions" ON public.upload_sessions;
DROP POLICY IF EXISTS "Users can update their own upload sessions" ON public.upload_sessions;
DROP POLICY IF EXISTS "Service role can manage all upload sessions" ON public.upload_sessions;

-- Create comprehensive RLS policies with explicit security
CREATE POLICY "Users can view their own upload sessions"
  ON public.upload_sessions FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.user_sessions 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own upload sessions"
  ON public.upload_sessions FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.user_sessions 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own upload sessions"
  ON public.upload_sessions FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM public.user_sessions 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.user_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- Service role needs full access for edge functions
CREATE POLICY "Service role can manage all upload sessions"
  ON public.upload_sessions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ===================================================================
-- 3. SECURE ALL VIDEO PROCESSING TABLES
-- ===================================================================

-- Ensure video_clips table has proper RLS
ALTER TABLE public.video_clips ENABLE ROW LEVEL SECURITY;

-- Drop and recreate video_clips policies
DROP POLICY IF EXISTS "Users can view their own video clips" ON public.video_clips;
DROP POLICY IF EXISTS "Users can insert clips for their sessions" ON public.video_clips;
DROP POLICY IF EXISTS "Users can update their own video clips" ON public.video_clips;

CREATE POLICY "Users can view their own video clips"
  ON public.video_clips FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.user_sessions 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert clips for their sessions"
  ON public.video_clips FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.user_sessions 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own video clips"
  ON public.video_clips FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM public.user_sessions 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.user_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- Service role needs full access for video processing
CREATE POLICY "Service role can manage all video clips"
  ON public.video_clips FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ===================================================================
-- 4. SECURE VIDEO_PROCESSING_JOBS TABLE
-- ===================================================================

-- Ensure video_processing_jobs table exists and has proper RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'video_processing_jobs') THEN
        -- Enable RLS
        ALTER TABLE public.video_processing_jobs ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own processing jobs" ON public.video_processing_jobs;
        DROP POLICY IF EXISTS "Service role can manage all processing jobs" ON public.video_processing_jobs;
        
        -- Create secure policies
        CREATE POLICY "Users can view their own processing jobs"
          ON public.video_processing_jobs FOR SELECT
          USING (
            session_id IN (
              SELECT id FROM public.user_sessions 
              WHERE user_id = auth.uid()
            )
          );

        CREATE POLICY "Service role can manage all processing jobs"
          ON public.video_processing_jobs FOR ALL
          USING (auth.role() = 'service_role')
          WITH CHECK (auth.role() = 'service_role');
          
        RAISE NOTICE 'video_processing_jobs table secured';
    END IF;
END $$;

-- ===================================================================
-- 5. AUDIT AND SECURE ALL FUNCTIONS
-- ===================================================================

-- Create a security audit function to check for insecure functions
CREATE OR REPLACE FUNCTION public.audit_security_definer_functions()
RETURNS TABLE(
    function_name TEXT,
    has_explicit_search_path BOOLEAN,
    security_status TEXT
)
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.proname::TEXT as function_name,
        p.proconfig IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM unnest(p.proconfig) AS config 
            WHERE config LIKE 'search_path=%'
        ) as has_explicit_search_path,
        CASE 
            WHEN p.proconfig IS NOT NULL AND 
                 EXISTS (
                     SELECT 1 FROM unnest(p.proconfig) AS config 
                     WHERE config LIKE 'search_path=%'
                 ) 
            THEN 'SECURE'
            ELSE 'NEEDS_FIX'
        END as security_status
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
        AND p.prosecdef = true  -- SECURITY DEFINER functions only
    ORDER BY p.proname;
END;
$$;

-- ===================================================================
-- 6. CREATE SECURITY MONITORING
-- ===================================================================

-- Create a function to monitor RLS status
CREATE OR REPLACE FUNCTION public.audit_rls_status()
RETURNS TABLE(
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count INTEGER,
    security_status TEXT
)
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.relname::TEXT as table_name,
        c.relrowsecurity as rls_enabled,
        (
            SELECT COUNT(*)::INTEGER 
            FROM pg_policy pol 
            WHERE pol.polrelid = c.oid
        ) as policy_count,
        CASE 
            WHEN c.relrowsecurity AND (
                SELECT COUNT(*) 
                FROM pg_policy pol 
                WHERE pol.polrelid = c.oid
            ) > 0 
            THEN 'SECURE'
            WHEN c.relrowsecurity 
            THEN 'RLS_ENABLED_NO_POLICIES'
            ELSE 'RLS_DISABLED'
        END as security_status
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
        AND c.relkind = 'r'  -- Regular tables only
        AND c.relname NOT LIKE 'pg_%'
    ORDER BY c.relname;
END;
$$;

-- ===================================================================
-- 7. ADD SECURITY DOCUMENTATION
-- ===================================================================

-- Add comprehensive security comments
COMMENT ON FUNCTION public.audit_security_definer_functions() IS 'Audits SECURITY DEFINER functions for proper search_path configuration. Returns security status of each function.';
COMMENT ON FUNCTION public.audit_rls_status() IS 'Audits Row Level Security status for all public tables. Returns RLS configuration and policy count.';

-- Add table security documentation
COMMENT ON TABLE public.upload_sessions IS 'Upload session tracking with comprehensive RLS policies for user data protection';
COMMENT ON TABLE public.video_clips IS 'AI-generated video clips with RLS enabled for user session isolation';
COMMENT ON TABLE public.user_sessions IS 'User session data with RLS policies ensuring users can only access their own sessions';

-- ===================================================================
-- 8. VALIDATION AND VERIFICATION
-- ===================================================================

-- Verify all critical functions have proper security
DO $$
DECLARE
    insecure_functions INTEGER;
    insecure_tables INTEGER;
BEGIN
    -- Check for insecure SECURITY DEFINER functions
    SELECT COUNT(*) INTO insecure_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
        AND p.prosecdef = true
        AND (p.proconfig IS NULL OR NOT EXISTS (
            SELECT 1 FROM unnest(p.proconfig) AS config 
            WHERE config LIKE 'search_path=%'
        ));
    
    -- Check for tables without RLS that should have it
    SELECT COUNT(*) INTO insecure_tables
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relname IN ('upload_sessions', 'video_clips', 'user_sessions', 'video_processing_jobs')
        AND NOT c.relrowsecurity;
    
    -- Report results
    IF insecure_functions > 0 THEN
        RAISE WARNING 'Found % SECURITY DEFINER functions without explicit search_path', insecure_functions;
    ELSE
        RAISE NOTICE 'All SECURITY DEFINER functions have explicit search_path - SECURE';
    END IF;
    
    IF insecure_tables > 0 THEN
        RAISE WARNING 'Found % critical tables without RLS enabled', insecure_tables;
    ELSE
        RAISE NOTICE 'All critical tables have RLS enabled - SECURE';
    END IF;
    
    RAISE NOTICE 'Security migration completed successfully';
END $$;

-- ===================================================================
-- 9. ADDITIONAL SECURITY HARDENING
-- ===================================================================

-- Ensure all user data tables have proper RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diffusion_analytics ENABLE ROW LEVEL SECURITY;

-- Create indexes for better RLS performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id_security ON public.user_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_upload_sessions_session_user_security ON public.upload_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_video_clips_session_user_security ON public.video_clips(session_id);

-- ===================================================================
-- 10. SECURITY AUDIT REPORT
-- ===================================================================

-- Create a comprehensive security report function
CREATE OR REPLACE FUNCTION public.generate_security_report()
RETURNS TABLE(
    category TEXT,
    item_name TEXT,
    status TEXT,
    recommendation TEXT
)
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
    -- Return security status of all critical components
    
    -- Check SECURITY DEFINER functions
    RETURN QUERY
    SELECT 
        'SECURITY_DEFINER_FUNCTIONS'::TEXT as category,
        p.proname::TEXT as item_name,
        CASE 
            WHEN p.proconfig IS NOT NULL AND 
                 EXISTS (
                     SELECT 1 FROM unnest(p.proconfig) AS config 
                     WHERE config LIKE 'search_path=%'
                 ) 
            THEN 'SECURE'
            ELSE 'VULNERABLE'
        END as status,
        CASE 
            WHEN p.proconfig IS NOT NULL AND 
                 EXISTS (
                     SELECT 1 FROM unnest(p.proconfig) AS config 
                     WHERE config LIKE 'search_path=%'
                 ) 
            THEN 'Function has explicit search_path - secure'
            ELSE 'Add SET search_path = public, pg_temp to function definition'
        END as recommendation
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
        AND p.prosecdef = true;
    
    -- Check RLS status
    RETURN QUERY
    SELECT 
        'ROW_LEVEL_SECURITY'::TEXT as category,
        c.relname::TEXT as item_name,
        CASE 
            WHEN c.relrowsecurity AND (
                SELECT COUNT(*) 
                FROM pg_policy pol 
                WHERE pol.polrelid = c.oid
            ) > 0 
            THEN 'SECURE'
            WHEN c.relrowsecurity 
            THEN 'RLS_ENABLED_NO_POLICIES'
            ELSE 'RLS_DISABLED'
        END as status,
        CASE 
            WHEN c.relrowsecurity AND (
                SELECT COUNT(*) 
                FROM pg_policy pol 
                WHERE pol.polrelid = c.oid
            ) > 0 
            THEN 'Table has RLS enabled with policies - secure'
            WHEN c.relrowsecurity 
            THEN 'Enable RLS policies for this table'
            ELSE 'Enable RLS on this table'
        END as recommendation
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relname IN ('upload_sessions', 'video_clips', 'user_sessions', 'video_processing_jobs', 'profiles', 'events');
END;
$$;

-- Add security documentation
COMMENT ON FUNCTION public.generate_security_report() IS 'Generates comprehensive security audit report for all critical database components. Use to verify security compliance.';

-- Final security verification
SELECT 'SECURITY_MIGRATION_COMPLETE' as status, NOW() as completed_at;