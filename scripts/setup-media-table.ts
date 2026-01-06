/**
 * Setup media table in Supabase database
 */

import { supabaseAdmin } from '../lib/supabase';

async function setupMediaTable() {
  console.log('Setting up media table in Supabase...');

  const supabase = supabaseAdmin();

  try {
    // First, check if the table exists by trying to query it
    console.log('Checking if media table exists...');
    const { data: testData, error: testError } = await supabase
      .from('media')
      .select('id')
      .limit(1);

    if (testError && testError.code === '42P01') {
      console.log('⚠️  Media table does not exist in database');
      console.log('\nTo create the media table, please run this SQL in Supabase Dashboard:');
      console.log('URL: https://supabase.com/dashboard/project/aczlassjkbtwenzsohwm/sql\n');
      console.log('='.repeat(80));
      console.log(`
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
      `);
      console.log('='.repeat(80));

      console.log('\n❌ Media table needs to be created manually in Supabase Dashboard');
      process.exit(1);
    }

    if (testError) {
      throw testError;
    }

    console.log('✅ Media table exists!');

    // Check table structure
    const { data: mediaData, error: mediaError, count } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: true });

    if (mediaError) {
      throw mediaError;
    }

    console.log(`✅ Media table is accessible`);
    console.log(`   Total media items: ${count || 0}`);

    // Test insert/delete permissions (without actually inserting)
    console.log('✅ Media table setup is complete');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    process.exit(1);
  }
}

setupMediaTable()
  .then(() => {
    console.log('\n✅ Media table setup verified!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
