-- Create resources table for SUCCESS+ downloadable resources
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('TEMPLATES', 'GUIDES', 'WORKSHEETS', 'EBOOKS', 'TOOLS', 'CHECKLISTS')),
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  thumbnail TEXT,
  downloads INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_resources_active ON resources(is_active);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active resources
CREATE POLICY "Public can view active resources"
ON resources FOR SELECT
USING (is_active = true);

-- Policy: Admins can manage all resources
CREATE POLICY "Admins can manage resources"
ON resources FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'SUPER_ADMIN')
  )
);
