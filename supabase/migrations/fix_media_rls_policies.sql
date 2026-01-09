-- Fix media table RLS policies to use correct role names
-- Change 'STAFF' to 'SOCIAL_TEAM' to match actual UserRole enum

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can upload media" ON media;
DROP POLICY IF EXISTS "Staff can update media" ON media;

-- Recreate with correct role names
CREATE POLICY "Staff can upload media"
ON media FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('ADMIN', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR', 'SOCIAL_TEAM')
  )
);

CREATE POLICY "Staff can update media"
ON media FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('ADMIN', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR', 'SOCIAL_TEAM')
  )
);
