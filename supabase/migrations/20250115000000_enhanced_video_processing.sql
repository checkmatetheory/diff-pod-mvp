-- Enhanced Video Processing Architecture
-- This migration adds proper job tracking and scalable video processing

-- Add enhanced tracking columns to user_sessions
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS video_processing_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS video_processing_retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_processing_last_checked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS video_processing_clips_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_processing_provider TEXT DEFAULT 'vizard',
ADD COLUMN IF NOT EXISTS video_processing_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS video_processing_completed_at TIMESTAMPTZ;

-- Create video_processing_jobs table for proper job tracking
CREATE TABLE IF NOT EXISTS video_processing_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'vizard',
  external_job_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Job configuration
  webhook_url TEXT,
  original_video_url TEXT,
  processing_options JSONB DEFAULT '{}',
  
  -- Tracking
  retry_count INTEGER DEFAULT 0,
  last_polled_at TIMESTAMPTZ,
  clips_count INTEGER DEFAULT 0,
  
  -- Results
  clips_data JSONB,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(provider, external_job_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_video_processing_jobs_session_id ON video_processing_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_video_processing_jobs_status ON video_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_video_processing_jobs_provider_external_id ON video_processing_jobs(provider, external_job_id);
CREATE INDEX IF NOT EXISTS idx_video_processing_jobs_last_polled ON video_processing_jobs(last_polled_at) WHERE status = 'processing';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_video_processing_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_processing_jobs_updated_at
    BEFORE UPDATE ON video_processing_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_video_processing_jobs_updated_at();

-- Migrate existing data from user_sessions
INSERT INTO video_processing_jobs (
  session_id, 
  provider, 
  external_job_id, 
  status,
  created_at,
  submitted_at
)
SELECT 
  id as session_id,
  'vizard' as provider,
  video_processing_job_id as external_job_id,
  CASE 
    WHEN video_processing_status = 'completed' THEN 'completed'
    WHEN video_processing_status = 'failed' THEN 'failed'
    WHEN video_processing_status = 'processing' THEN 'processing'
    ELSE 'submitted'
  END as status,
  created_at,
  created_at as submitted_at
FROM user_sessions 
WHERE video_processing_job_id IS NOT NULL
ON CONFLICT (provider, external_job_id) DO NOTHING;

-- Create function to automatically create job entries
CREATE OR REPLACE FUNCTION create_video_processing_job()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create job if video_processing_job_id is being set for the first time
    IF OLD.video_processing_job_id IS NULL AND NEW.video_processing_job_id IS NOT NULL THEN
        INSERT INTO video_processing_jobs (
            session_id,
            provider,
            external_job_id,
            status,
            webhook_url,
            submitted_at
        ) VALUES (
            NEW.id,
            COALESCE(NEW.video_processing_provider, 'vizard'),
            NEW.video_processing_job_id,
            COALESCE(NEW.video_processing_status, 'submitted'),
            NEW.video_processing_webhook_url,
            NOW()
        )
        ON CONFLICT (provider, external_job_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_sessions_create_job
    AFTER UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION create_video_processing_job();