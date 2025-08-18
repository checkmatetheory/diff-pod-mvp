-- Quick fix to add the missing column
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS video_processing_clips_count INTEGER DEFAULT 0;