/**
 * Create media table directly in Supabase using REST API
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTAwMTQ2NCwiZXhwIjoyMDUwNTc3NDY0fQ.eLSjcORz_c0KsOAL1r5f_rU4tvDOPAWN5QGMI7bnHbY';

const supabase = createClient(supabaseUrl, supabaseKey);

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
`;

async function createMediaTable() {
  console.log('Creating media table in Supabase...\n');

  try {
    // First check if table exists
    console.log('Checking if media table already exists...');
    const { data: testData, error: testError } = await supabase
      .from('media')
      .select('id')
      .limit(1);

    if (!testError) {
      console.log('✅ Media table already exists!');

      const { count } = await supabase
        .from('media')
        .select('*', { count: 'exact', head: true });

      console.log(`   Total media items: ${count || 0}`);
      console.log('\n✅ No action needed - table is ready to use');
      process.exit(0);
    }

    if (testError.code !== '42P01') {
      // Some other error
      throw testError;
    }

    console.log('⚠️  Table does not exist. Creating...\n');

    // Supabase client doesn't support raw SQL execution
    // We need to use the Management API or run via Dashboard
    console.log('❌ Unable to create table via Supabase client');
    console.log('\nPlease run the following SQL in Supabase Dashboard:');
    console.log('URL: https://supabase.com/dashboard/project/aczlassjkbtwenzsohwm/sql\n');
    console.log('='.repeat(80));
    console.log(sql);
    console.log('='.repeat(80));
    console.log('\nAfter running the SQL, run this script again to verify.');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    process.exit(1);
  }
}

createMediaTable();
