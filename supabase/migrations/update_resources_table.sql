-- Add missing columns to existing resources table
ALTER TABLE resources
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_active ON resources(is_active);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active resources" ON resources;
DROP POLICY IF EXISTS "Admins can manage resources" ON resources;

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
