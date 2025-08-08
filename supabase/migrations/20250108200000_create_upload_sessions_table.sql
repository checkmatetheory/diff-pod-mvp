-- Create upload_sessions table for tracking direct uploads
CREATE TABLE IF NOT EXISTS upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  unique_file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  content_type TEXT NOT NULL,
  upload_status TEXT NOT NULL DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed', 'cancelled')),
  signed_url TEXT,
  bytes_uploaded BIGINT DEFAULT 0,
  upload_progress NUMERIC(5,2) DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_upload_sessions_session_id ON upload_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON upload_sessions(upload_status);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_created_at ON upload_sessions(created_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_upload_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_upload_sessions_updated_at
  BEFORE UPDATE ON upload_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_upload_sessions_updated_at();

-- Enable RLS
ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own upload sessions"
  ON upload_sessions FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM user_sessions 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own upload sessions"
  ON upload_sessions FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM user_sessions 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own upload sessions"
  ON upload_sessions FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM user_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- Service role can manage all upload sessions
CREATE POLICY "Service role can manage all upload sessions"
  ON upload_sessions FOR ALL
  USING (auth.role() = 'service_role');