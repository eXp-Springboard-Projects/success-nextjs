/**
 * Create media table using Supabase Management API
 */

import fetch from 'node-fetch';

const SUPABASE_PROJECT_REF = 'aczlassjkbtwenzsohwm';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

// You'll need to get this from Supabase Dashboard > Project Settings > API > service_role key
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTAwMTQ2NCwiZXhwIjoyMDUwNTc3NDY0fQ.eLSjcORz_c0KsOAL1r5f_rU4tvDOPAWN5QGMI7bnHbY';

const sql = `
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
DROP POLICY IF EXISTS "Public can view media" ON media;
CREATE POLICY "Public can view media"
ON media FOR SELECT
USING (true);

-- Policy: Authenticated users with appropriate roles can upload media
DROP POLICY IF EXISTS "Staff can upload media" ON media;
CREATE POLICY "Staff can upload media"
ON media FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('ADMIN', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR', 'STAFF')
  )
);

-- Policy: Authenticated users with appropriate roles can update media
DROP POLICY IF EXISTS "Staff can update media" ON media;
CREATE POLICY "Staff can update media"
ON media FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('ADMIN', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR', 'STAFF')
  )
);

-- Policy: Admins can delete media
DROP POLICY IF EXISTS "Admins can delete media" ON media;
CREATE POLICY "Admins can delete media"
ON media FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role IN ('ADMIN', 'SUPER_ADMIN')
  )
);
`;

async function setupMediaTable() {
  console.log('Setting up media table via Supabase REST API...\n');

  try {
    // First, let's try to check if the table exists by querying it
    console.log('Checking if media table exists...');
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/media?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });

    if (checkResponse.ok) {
      console.log('✅ Media table already exists!');
      const data = await checkResponse.json();
      console.log(`   Found ${Array.isArray(data) ? data.length : 0} media items in first page`);
      console.log('\n✅ Media library is ready to use!');
      return;
    }

    // If we get a 406 or other error, table might not exist
    console.log(`Table check returned status: ${checkResponse.status}`);

    if (checkResponse.status === 406 || checkResponse.status === 404) {
      console.log('⚠️  Table does not exist or is not accessible\n');

      console.log('To create the media table, please:');
      console.log('1. Visit https://supabase.com/dashboard/project/aczlassjkbtwenzsohwm/sql');
      console.log('2. Copy and paste the SQL below:');
      console.log('\n' + '='.repeat(80));
      console.log(sql);
      console.log('='.repeat(80) + '\n');
      console.log('3. Click "Run" to execute the SQL');
      console.log('4. Return to https://www.success.com/admin/media-setup to verify\n');
    } else {
      const errorText = await checkResponse.text();
      console.log('Error response:', errorText);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);

    console.log('\nPlease create the media table manually:');
    console.log('1. Visit https://supabase.com/dashboard/project/aczlassjkbtwenzsohwm/sql');
    console.log('2. Run the SQL provided in the setup page');
  }
}

setupMediaTable();
