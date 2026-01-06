/**
 * Create media table using direct PostgreSQL connection
 */

import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || "postgres://e731f8c351f1974c788b739203b00113561ca6e26a0a8c0d7d5efcea8cf9b656:sk_LYHdgk8RomZonUpgI9S97@db.prisma.io:5432/postgres?sslmode=require";

const createTableSql = `
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
`;

const createIndexesSql = `
-- Create indexes for better performance (note: column names with mixed case must be quoted)
CREATE INDEX IF NOT EXISTS idx_media_wordpress_id ON media USING btree ("wordpressId");
CREATE INDEX IF NOT EXISTS idx_media_url ON media USING btree (url);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media USING btree ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_media_mime_type ON media USING btree ("mimeType");
`;

const enableRLSSql = `
-- Enable Row Level Security
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
`;

const createPoliciesSql = `
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view media" ON media;
DROP POLICY IF EXISTS "Staff can upload media" ON media;
DROP POLICY IF EXISTS "Staff can update media" ON media;
DROP POLICY IF EXISTS "Admins can delete media" ON media;

-- Policy: Public can view media
CREATE POLICY "Public can view media"
ON media FOR SELECT
USING (true);

-- Policy: Staff can upload media (simplified - no user check for now)
CREATE POLICY "Staff can upload media"
ON media FOR INSERT
WITH CHECK (true);

-- Policy: Staff can update media (simplified - no user check for now)
CREATE POLICY "Staff can update media"
ON media FOR UPDATE
USING (true);

-- Policy: Admins can delete media (simplified - no user check for now)
CREATE POLICY "Admins can delete media"
ON media FOR DELETE
USING (true);
`;

async function createMediaTable() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('Step 1: Creating media table...');
    await client.query(createTableSql);
    console.log('✅ Media table created\n');

    console.log('Step 2: Creating indexes...');
    await client.query(createIndexesSql);
    console.log('✅ Indexes created\n');

    console.log('Step 3: Enabling Row Level Security...');
    await client.query(enableRLSSql);
    console.log('✅ RLS enabled\n');

    console.log('Step 4: Creating security policies...');
    await client.query(createPoliciesSql);
    console.log('✅ Policies created\n');

    // Verify the table was created
    console.log('Verifying table structure...');
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'media'
      ORDER BY ordinal_position;
    `);

    console.log('Media table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Check for existing data
    const countResult = await client.query('SELECT COUNT(*) FROM media');
    console.log(`\n✅ Media table is ready with ${countResult.rows[0].count} items`);

  } catch (error: any) {
    console.error('❌ Error creating media table:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

createMediaTable()
  .then(() => {
    console.log('\n🎉 Media table setup complete!');
    console.log('You can now use the media library at: https://www.success.com/admin/media');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  });
