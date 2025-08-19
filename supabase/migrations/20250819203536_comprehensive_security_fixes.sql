-- Comprehensive Security Fixes Migration
-- Addresses all Supabase Security Advisor warnings with proper secure implementations

-- ===================================================================
-- 1. FIX FUNCTION SEARCH PATH MUTABLE ISSUES
-- ===================================================================

-- All SECURITY DEFINER functions must have explicit search_path to prevent
-- search path injection attacks. This is a critical security requirement.

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

-- Fix generate_speaker_slug function if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_speaker_slug') THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.generate_speaker_slug()
        RETURNS TRIGGER 
        SECURITY DEFINER
        SET search_path = public, pg_temp
        LANGUAGE plpgsql
        AS $func$
        BEGIN
            IF NEW.slug IS NULL OR NEW.slug = '''' THEN
                NEW.slug = lower(
                    regexp_replace(
                        regexp_replace(NEW.full_name, ''[^a-zA-Z0-9\s]'', '''', ''g''),
                        ''\s+'', ''-'', ''g''
                    )
                );
                
                -- Ensure uniqueness
                WHILE EXISTS (SELECT 1 FROM public.speakers WHERE slug = NEW.slug AND id != COALESCE(NEW.id, ''00000000-0000-0000-0000-000000000000''::uuid)) LOOP
                    NEW.slug = NEW.slug || ''-'' || floor(random() * 1000)::text;
                END LOOP;
            END IF;
            
            RETURN NEW;
        END;
        $func$;';
    END IF;
END $$;

-- Fix generate_microsite_url function if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_microsite_url') THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.generate_microsite_url()
        RETURNS TRIGGER 
        SECURITY DEFINER
        SET search_path = public, pg_temp
        LANGUAGE plpgsql
        AS $func$
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
            NEW.microsite_url = event_subdomain || ''.diffused.app/'' || speaker_slug;
            
            RETURN NEW;
        END;
        $func$;';
    END IF;
END $$;

-- Fix generate_referral_code function if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_referral_code') THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.generate_referral_code()
        RETURNS TRIGGER 
        SECURITY DEFINER
        SET search_path = public, pg_temp
        LANGUAGE plpgsql
        AS $func$
        BEGIN
            IF NEW.code IS NULL OR NEW.code = '''' THEN
                NEW.code = upper(substring(md5(random()::text) from 1 for 8));
                
                -- Ensure uniqueness
                WHILE EXISTS (SELECT 1 FROM public.referral_codes WHERE code = NEW.code) LOOP
                    NEW.code = upper(substring(md5(random()::text) from 1 for 8));
                END LOOP;
            END IF;
            
            RETURN NEW;
        END;
        $func$;';
    END IF;
END $$;

-- ===================================================================
-- 2. ENSURE PROPER RLS ON ALL CRITICAL TABLES
-- ===================================================================

-- Enable RLS on upload_sessions (should already be enabled but ensure it)
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;

-- Ensure video_clips has RLS enabled
ALTER TABLE public.video_clips ENABLE ROW LEVEL SECURITY;

-- Ensure video_processing_jobs has RLS if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'video_processing_jobs') THEN
        ALTER TABLE public.video_processing_jobs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ===================================================================
-- 3. SECURITY VALIDATION
-- ===================================================================

-- Verify all SECURITY DEFINER functions have explicit search_path
DO $$
DECLARE
    insecure_function_count INTEGER;
    function_record RECORD;
BEGIN
    -- Count insecure functions
    SELECT COUNT(*) INTO insecure_function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
        AND p.prosecdef = true
        AND (p.proconfig IS NULL OR NOT EXISTS (
            SELECT 1 FROM unnest(p.proconfig) AS config 
            WHERE config LIKE 'search_path=%'
        ));
    
    -- Report any remaining insecure functions
    IF insecure_function_count > 0 THEN
        RAISE WARNING 'Found % SECURITY DEFINER functions still without explicit search_path:', insecure_function_count;
        
        FOR function_record IN 
            SELECT p.proname
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
                AND p.prosecdef = true
                AND (p.proconfig IS NULL OR NOT EXISTS (
                    SELECT 1 FROM unnest(p.proconfig) AS config 
                    WHERE config LIKE 'search_path=%'
                ))
        LOOP
            RAISE WARNING 'Insecure function: %', function_record.proname;
        END LOOP;
    ELSE
        RAISE NOTICE 'All SECURITY DEFINER functions now have explicit search_path - SECURE';
    END IF;
END $$;

-- Verify RLS status on critical tables
DO $$
DECLARE
    table_record RECORD;
    insecure_table_count INTEGER := 0;
BEGIN
    FOR table_record IN 
        SELECT 
            c.relname as table_name,
            c.relrowsecurity as rls_enabled,
            (SELECT COUNT(*) FROM pg_policy pol WHERE pol.polrelid = c.oid) as policy_count
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
            AND c.relkind = 'r'
            AND c.relname IN ('upload_sessions', 'video_clips', 'user_sessions', 'video_processing_jobs')
    LOOP
        IF NOT table_record.rls_enabled THEN
            RAISE WARNING 'Table % does not have RLS enabled', table_record.table_name;
            insecure_table_count := insecure_table_count + 1;
        ELSIF table_record.policy_count = 0 THEN
            RAISE WARNING 'Table % has RLS enabled but no policies', table_record.table_name;
            insecure_table_count := insecure_table_count + 1;
        ELSE
            RAISE NOTICE 'Table % is properly secured (RLS enabled with % policies)', table_record.table_name, table_record.policy_count;
        END IF;
    END LOOP;
    
    IF insecure_table_count = 0 THEN
        RAISE NOTICE 'All critical tables are properly secured with RLS';
    END IF;
END $$;

-- Final verification
RAISE NOTICE 'Comprehensive security fixes migration completed at %', NOW();
