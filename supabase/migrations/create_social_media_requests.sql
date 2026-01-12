-- Create social_media_requests table
CREATE TABLE IF NOT EXISTS social_media_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  requested_by TEXT NOT NULL,
  requested_by_name TEXT,
  assigned_to TEXT,
  assigned_to_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_social_media_requests_status ON social_media_requests(status);

-- Create index on requested_by for filtering
CREATE INDEX IF NOT EXISTS idx_social_media_requests_requested_by ON social_media_requests(requested_by);

-- Create index on assigned_to for filtering
CREATE INDEX IF NOT EXISTS idx_social_media_requests_assigned_to ON social_media_requests(assigned_to);

-- Enable Row Level Security
ALTER TABLE social_media_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all requests
CREATE POLICY "Allow authenticated users to read requests" ON social_media_requests
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to create requests
CREATE POLICY "Allow authenticated users to create requests" ON social_media_requests
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update requests
CREATE POLICY "Allow authenticated users to update requests" ON social_media_requests
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete requests
CREATE POLICY "Allow authenticated users to delete requests" ON social_media_requests
  FOR DELETE
  USING (auth.role() = 'authenticated');
