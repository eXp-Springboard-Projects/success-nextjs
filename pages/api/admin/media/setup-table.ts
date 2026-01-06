import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Only super admins can setup tables' });
  }

  try {
    const supabase = supabaseAdmin();

    // Check if table exists
    const { data: testData, error: testError } = await supabase
      .from('media')
      .select('id')
      .limit(1);

    if (testError && testError.code === '42P01') {
      // Table doesn't exist
      return res.status(200).json({
        tableExists: false,
        message: 'Media table does not exist. Please create it in Supabase Dashboard.',
        sql: `
-- Run this SQL in Supabase Dashboard: https://supabase.com/dashboard/project/aczlassjkbtwenzsohwm/sql

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

CREATE INDEX IF NOT EXISTS idx_media_wordpress_id ON media("wordpressId");
CREATE INDEX IF NOT EXISTS idx_media_url ON media(url);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_media_mime_type ON media("mimeType");

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
        `.trim()
      });
    }

    if (testError) {
      throw testError;
    }

    // Table exists
    const { count } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: true });

    return res.status(200).json({
      tableExists: true,
      message: 'Media table exists and is ready',
      itemCount: count || 0
    });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to check media table',
      message: error.message
    });
  }
}
