import { Client } from 'pg';

const DATABASE_URL = "postgres://e731f8c351f1974c788b739203b00113561ca6e26a0a8c0d7d5efcea8cf9b656:sk_LYHdgk8RomZonUpgI9S97@db.prisma.io:5432/postgres?sslmode=require";

async function addMissingColumns() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Add wordpressId column
    console.log('Adding wordpressId column...');
    await client.query(`
      ALTER TABLE media
      ADD COLUMN IF NOT EXISTS "wordpressId" INTEGER UNIQUE;
    `);
    console.log('✅ Added wordpressId column\n');

    // Add metadata column
    console.log('Adding metadata column...');
    await client.query(`
      ALTER TABLE media
      ADD COLUMN IF NOT EXISTS metadata JSONB;
    `);
    console.log('✅ Added metadata column\n');

    // Create indexes
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_media_wordpress_id ON media USING btree ("wordpressId");
      CREATE INDEX IF NOT EXISTS idx_media_url ON media USING btree (url);
      CREATE INDEX IF NOT EXISTS idx_media_created_at ON media USING btree ("createdAt" DESC);
      CREATE INDEX IF NOT EXISTS idx_media_mime_type ON media USING btree ("mimeType");
    `);
    console.log('✅ Indexes created\n');

    // Enable RLS if not already enabled
    console.log('Enabling Row Level Security...');
    await client.query('ALTER TABLE media ENABLE ROW LEVEL SECURITY;');
    console.log('✅ RLS enabled\n');

    // Create policies
    console.log('Creating/updating security policies...');
    await client.query(`
      DROP POLICY IF EXISTS "Public can view media" ON media;
      DROP POLICY IF EXISTS "Staff can upload media" ON media;
      DROP POLICY IF EXISTS "Staff can update media" ON media;
      DROP POLICY IF EXISTS "Admins can delete media" ON media;

      CREATE POLICY "Public can view media"
      ON media FOR SELECT
      USING (true);

      CREATE POLICY "Staff can upload media"
      ON media FOR INSERT
      WITH CHECK (true);

      CREATE POLICY "Staff can update media"
      ON media FOR UPDATE
      USING (true);

      CREATE POLICY "Admins can delete media"
      ON media FOR DELETE
      USING (true);
    `);
    console.log('✅ Policies created\n');

    // Verify final structure
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'media'
      ORDER BY ordinal_position
    `);

    console.log('Final media table structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

    const countResult = await client.query('SELECT COUNT(*) FROM media');
    console.log(`\n✅ Media table ready with ${countResult.rows[0].count} items`);

    await client.end();
    console.log('\n🎉 Media library is ready to use!');
    console.log('Visit: https://www.success.com/admin/media');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

addMissingColumns().catch(e => process.exit(1));
