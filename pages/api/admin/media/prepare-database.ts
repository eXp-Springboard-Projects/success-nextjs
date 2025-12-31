import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { Pool } from 'pg';

/**
 * Prepare database for WordPress media import
 * This endpoint adds necessary columns and indexes to the media table
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Parse the DATABASE_URL to get connection parameters
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined
    });

    console.log('[DB Prepare] Connecting to database...');

    // Check if media table exists and add missing columns
    const sql = `
      DO $$
      BEGIN
        -- Add wordpressId column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'media' AND column_name = 'wordpressId'
        ) THEN
          ALTER TABLE media ADD COLUMN "wordpressId" INTEGER;
          CREATE UNIQUE INDEX idx_media_wordpress_id ON media("wordpressId");
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
          RAISE NOTICE 'Created url index';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE tablename = 'media' AND indexname = 'idx_media_created_at'
        ) THEN
          CREATE INDEX idx_media_created_at ON media("createdAt" DESC);
          RAISE NOTICE 'Created createdAt index';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE tablename = 'media' AND indexname = 'idx_media_mime_type'
        ) THEN
          CREATE INDEX idx_media_mime_type ON media("mimeType");
          RAISE NOTICE 'Created mimeType index';
        END IF;
      END $$;
    `;

    const result = await pool.query(sql);
    await pool.end();

    console.log('[DB Prepare] Database prepared successfully');

    return res.status(200).json({
      success: true,
      message: 'Database prepared for WordPress media import'
    });

  } catch (error: any) {
    console.error('[DB Prepare] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to prepare database',
      error: error.message
    });
  }
}
