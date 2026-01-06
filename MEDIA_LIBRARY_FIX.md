# Media Library Fix - January 5, 2026

## Problem

The media library at `/admin/media` wasn't working. Staff were getting errors when trying to upload or view media files.

**Root Cause**: The `media` table didn't exist in the Supabase database.

## Solution

Created a complete setup system to fix the media library:

### 1. Database Migration (`supabase/migrations/create_media_table.sql`)
- Creates `media` table with proper schema
- Includes fields for: filename, url, mimeType, size, width, height, alt, caption, metadata
- Supports WordPress imports with `wordpressId` field
- Creates indexes for better performance
- Sets up Row Level Security (RLS) policies:
  - Public can view media
  - Staff can upload/update media
  - Admins can delete media

### 2. Setup Page (`/admin/media-setup`)
- Checks if media table exists
- If missing: provides SQL to run in Supabase Dashboard
- If exists: shows table status and media count
- Includes copy-to-clipboard for easy SQL copying
- Direct link to Supabase SQL Editor

### 3. API Endpoint (`/api/admin/media/setup-table`)
- POST endpoint to check table status
- Returns table existence status
- Provides setup SQL if table is missing
- Shows item count if table exists

### 4. Enhanced Error Handling
- Updated `/admin/media` page to show helpful errors
- Alerts users if table doesn't exist
- Guides them to contact administrator

## How to Set Up

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to https://www.success.com/admin/media-setup
2. Copy the SQL provided
3. Open Supabase SQL Editor: https://supabase.com/dashboard/project/aczlassjkbtwenzsohwm/sql
4. Paste and run the SQL
5. Return to the setup page and click "Check Again"
6. Click "Go to Media Library" once ready

### Option 2: Manual SQL Execution
Run this SQL in your Supabase Dashboard:

```sql
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_wordpress_id ON media("wordpressId");
CREATE INDEX IF NOT EXISTS idx_media_url ON media(url);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_media_mime_type ON media("mimeType");

-- RLS Policies
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can view media"
ON media FOR SELECT
USING (true);

CREATE POLICY IF NOT EXISTS "Staff can upload media"
ON media FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('ADMIN', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR', 'STAFF')
  )
);

CREATE POLICY IF NOT EXISTS "Staff can update media"
ON media FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('ADMIN', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR', 'STAFF')
  )
);

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

## Media Library Features

Once set up, staff can:
- ✅ Upload images, videos, and audio files (max 10MB)
- ✅ Search and filter media by name and type
- ✅ Copy URLs for use in articles and pages
- ✅ View image details (dimensions, file size, upload date)
- ✅ Export images as PDFs
- ✅ Delete unwanted media files
- ✅ Local storage for development (files in `/public/uploads`)
- ✅ Vercel Blob storage for production

## Technical Details

### File Storage
- **Development**: Files saved to `/public/uploads/` directory
- **Production**: Files uploaded to Vercel Blob Storage
- Automatic detection via `BLOB_READ_WRITE_TOKEN` environment variable

### Supported File Types
- Images: JPEG, PNG, WebP, GIF
- Videos: MP4, MOV, WebM (via media library)
- Audio: MP3, WAV (via media library)

### Image Optimization
In production, images are automatically:
- Resized to max 2000px width
- Compressed with 80% quality (mozjpeg)
- Generated in multiple sizes (thumbnail, small, medium, large)
- Converted to WebP for better compression
- Stored with responsive image srcsets

### Security
- Row Level Security (RLS) enforced on all operations
- Role-based access control:
  - **View**: Public
  - **Upload/Update**: Staff, Author, Editor, Admin, Super Admin
  - **Delete**: Admin, Super Admin only
- File type validation
- File size limits (10MB max)

## Deployment

Deployed to production: https://www.success.com

### Files Changed
- `pages/admin/media-setup.tsx` - Setup page
- `pages/api/admin/media/setup-table.ts` - Setup API
- `pages/admin/media/index.tsx` - Enhanced error handling
- `supabase/migrations/create_media_table.sql` - Database migration
- `scripts/setup-media-table.ts` - Setup verification script

## Next Steps

After setting up the media table, staff should:
1. Visit https://www.success.com/admin/media-setup to verify setup
2. Test uploading a file at https://www.success.com/admin/media
3. Import WordPress media if needed via `/admin/media/import`

## Notes

- The media table is separate from WordPress and fully managed in Supabase
- Files uploaded locally (development) are stored in `/public/uploads/`
- Files uploaded to production use Vercel Blob Storage
- The `wordpressId` field allows importing media from WordPress without duplicates
