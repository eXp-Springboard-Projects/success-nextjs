# Setup Media Table - Quick Instructions

The media library requires a database table that needs to be created in Supabase.

## Option 1: Via Web Interface (Easiest)

1. **Go to the setup page**: https://www.success.com/admin/media-setup
2. **Copy the SQL** provided on that page
3. **Open Supabase SQL Editor**: https://supabase.com/dashboard/project/aczlassjkbtwenzsohwm/sql
4. **Paste and run** the SQL
5. **Verify** by returning to the setup page and clicking "Check Again"

## Option 2: Run SQL Directly

Go to https://supabase.com/dashboard/project/aczlassjkbtwenzsohwm/sql and run:

```sql
-- Create media table for admin media library
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "wordpressId" INTEGER UNIQUE,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  "mimeType" TEXT,
  size INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  alt TEXT,
  caption TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "uploadedBy" TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_wordpress_id ON media("wordpressId");
CREATE INDEX IF NOT EXISTS idx_media_url ON media(url);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_media_mime_type ON media("mimeType");

-- Enable Row Level Security
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view media
CREATE POLICY IF NOT EXISTS "Public can view media"
ON media FOR SELECT
USING (true);

-- Policy: Authenticated users with appropriate roles can upload media
CREATE POLICY IF NOT EXISTS "Staff can upload media"
ON media FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('ADMIN', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR', 'STAFF')
  )
);

-- Policy: Authenticated users with appropriate roles can update media
CREATE POLICY IF NOT EXISTS "Staff can update media"
ON media FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('ADMIN', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR', 'STAFF')
  )
);

-- Policy: Admins can delete media
CREATE POLICY IF NOT EXISTS "Admins can delete media"
ON media FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('ADMIN', 'SUPER_ADMIN')
  )
);
```

## After Setup

Once the SQL is run successfully:
- Visit https://www.success.com/admin/media to use the media library
- Upload files, manage media, and copy URLs for use in articles

## Need Help?

The setup page at https://www.success.com/admin/media-setup will:
- ✅ Check if the table exists
- ✅ Show current status
- ✅ Provide copy-to-clipboard SQL
- ✅ Give you a direct link to Supabase Dashboard

---

**Note**: The Supabase API keys in the `.env` files may need to be refreshed if they've expired. You can get fresh keys from:
https://supabase.com/dashboard/project/aczlassjkbtwenzsohwm/settings/api
