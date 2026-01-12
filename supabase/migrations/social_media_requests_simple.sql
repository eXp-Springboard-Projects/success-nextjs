-- Create social_media_requests table (run this in Supabase SQL Editor)
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_social_media_requests_status ON social_media_requests(status);
CREATE INDEX IF NOT EXISTS idx_social_media_requests_requested_by ON social_media_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_social_media_requests_assigned_to ON social_media_requests(assigned_to);
