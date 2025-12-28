/**
 * Add WordPress-specific fields to media table
 * Run this to prepare the database for WordPress media import
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addWordPressMediaFields() {
  console.log('Adding WordPress media fields to media table...');

  try {
    // Check if media table exists
    const { data: tables, error: tablesError } = await supabase
      .from('media')
      .select('id')
      .limit(1);

    if (tablesError && tablesError.code === '42P01') {
      console.log('Media table does not exist. Creating it...');

      // Create media table with all fields
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
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
        `
      });

      if (createError) {
        throw createError;
      }

      console.log('✅ Media table created successfully');
      return;
    }

    if (tablesError) {
      throw tablesError;
    }

    console.log('Media table exists. Checking for WordPress fields...');

    // Add wordpressId column if it doesn't exist
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          -- Add wordpressId column
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'media' AND column_name = 'wordpressId'
          ) THEN
            ALTER TABLE media ADD COLUMN "wordpressId" INTEGER UNIQUE;
            CREATE INDEX idx_media_wordpress_id ON media("wordpressId");
            RAISE NOTICE 'Added wordpressId column';
          END IF;

          -- Add metadata column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'media' AND column_name = 'metadata'
          ) THEN
            ALTER TABLE media ADD COLUMN metadata JSONB;
            RAISE NOTICE 'Added metadata column';
          END IF;

          -- Add uploadedBy column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'media' AND column_name = 'uploadedBy'
          ) THEN
            ALTER TABLE media ADD COLUMN "uploadedBy" TEXT;
            RAISE NOTICE 'Added uploadedBy column';
          END IF;

          -- Ensure indexes exist
          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE tablename = 'media' AND indexname = 'idx_media_url'
          ) THEN
            CREATE INDEX idx_media_url ON media(url);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE tablename = 'media' AND indexname = 'idx_media_created_at'
          ) THEN
            CREATE INDEX idx_media_created_at ON media("createdAt" DESC);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE tablename = 'media' AND indexname = 'idx_media_mime_type'
          ) THEN
            CREATE INDEX idx_media_mime_type ON media("mimeType");
          END IF;
        END $$;
      `
    });

    if (alterError) {
      throw alterError;
    }

    console.log('✅ WordPress media fields added successfully');
    console.log('✅ Database is ready for WordPress media import');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addWordPressMediaFields()
  .then(() => {
    console.log('\n✅ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
