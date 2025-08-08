-- Add video processing columns to user_sessions table
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS video_processing_job_id TEXT,
ADD COLUMN IF NOT EXISTS video_processing_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS video_processing_error TEXT,
ADD COLUMN IF NOT EXISTS video_processing_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS video_processing_metadata JSONB;

-- Create video_clips table for storing AI-generated clips
CREATE TABLE IF NOT EXISTS video_clips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
  clip_id TEXT NOT NULL,
  title TEXT,
  duration INTEGER, -- duration in seconds
  video_url TEXT,
  thumbnail_url TEXT,
  virality_score INTEGER DEFAULT 0,
  transcript TEXT,
  suggested_caption TEXT,
  suggested_hashtags TEXT[], -- array of hashtags
  status TEXT DEFAULT 'ready', -- ready, published, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id, clip_id)
);

-- Add RLS (Row Level Security) policies for video_clips
ALTER TABLE video_clips ENABLE ROW LEVEL SECURITY;

-- Users can only see clips from their own sessions
CREATE POLICY "Users can view their own video clips" ON video_clips
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM user_sessions WHERE user_id = auth.uid()
    )
  );

-- Users can insert clips for their own sessions (for API usage)
CREATE POLICY "Users can insert clips for their sessions" ON video_clips
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM user_sessions WHERE user_id = auth.uid()
    )
  );

-- Users can update clips from their own sessions
CREATE POLICY "Users can update their own video clips" ON video_clips
  FOR UPDATE USING (
    session_id IN (
      SELECT id FROM user_sessions WHERE user_id = auth.uid()
    )
  );

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_video_clips_session_id ON video_clips(session_id);
CREATE INDEX IF NOT EXISTS idx_video_clips_status ON video_clips(status);
CREATE INDEX IF NOT EXISTS idx_video_clips_virality_score ON video_clips(virality_score DESC);

-- Add indexes for video processing columns
CREATE INDEX IF NOT EXISTS idx_user_sessions_video_job_id ON user_sessions(video_processing_job_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_video_status ON user_sessions(video_processing_status);

-- Comment on the new table
COMMENT ON TABLE video_clips IS 'AI-generated video clips from Vizard processing';
COMMENT ON COLUMN video_clips.virality_score IS 'Virality score from 0-100, higher means more viral potential';
COMMENT ON COLUMN video_clips.suggested_hashtags IS 'Array of suggested hashtags for social media';
COMMENT ON COLUMN user_sessions.video_processing_job_id IS 'External job ID from Vizard AI processing';
COMMENT ON COLUMN user_sessions.video_processing_status IS 'Status: pending, submitted, processing, completed, failed';