-- Create storage bucket for resources if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to resources
CREATE POLICY IF NOT EXISTS "Public can view resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'resources');

-- Policy: Admins can upload resources
CREATE POLICY IF NOT EXISTS "Admins can upload resources"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resources' AND
  (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'SUPER_ADMIN', 'STAFF')
  ))
);

-- Policy: Admins can delete resources
CREATE POLICY IF NOT EXISTS "Admins can delete resources"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resources' AND
  (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('ADMIN', 'SUPER_ADMIN')
  ))
);

-- Policy: Service role can do everything
CREATE POLICY IF NOT EXISTS "Service role has full access to resources"
ON storage.objects FOR ALL
USING (bucket_id = 'resources' AND auth.role() = 'service_role');
