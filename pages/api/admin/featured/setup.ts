import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return res.status(401).json({ error: 'Unauthorized - Super Admin only' });
  }

  const supabase = supabaseAdmin();

  try {
    // Create the homepage_placements table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS homepage_placements (
        id TEXT PRIMARY KEY,
        "postId" TEXT NOT NULL,
        zone TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "createdBy" TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS homepage_placements_zone_active_idx
        ON homepage_placements(zone, active, position);

      CREATE INDEX IF NOT EXISTS homepage_placements_postId_idx
        ON homepage_placements("postId");

      CREATE UNIQUE INDEX IF NOT EXISTS homepage_placements_zone_position_key
        ON homepage_placements(zone, position) WHERE active = true;
    `;

    // Note: Supabase doesn't support direct SQL execution via client
    // We'll check if table exists by trying to query it
    const { error: testError } = await supabase
      .from('homepage_placements')
      .select('id')
      .limit(1);

    if (testError && testError.message.includes('relation') && testError.message.includes('does not exist')) {
      return res.status(200).json({
        success: false,
        message: 'Table does not exist. Please create it manually using the SQL editor in Supabase Dashboard:',
        sql: createTableSQL,
        instructions: [
          '1. Go to Supabase Dashboard > SQL Editor',
          '2. Paste the SQL above',
          '3. Click "Run"',
          '4. Refresh this page'
        ]
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Homepage placements table already exists and is ready to use!',
    });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Setup failed',
      message: error.message,
    });
  }
}
