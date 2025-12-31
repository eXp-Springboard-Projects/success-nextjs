/**
 * Cron Job: Publish Due Posts
 * POST /api/social/cron/publish
 *
 * Called by Vercel Cron every 5 minutes to publish scheduled posts
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { publishDuePosts } from '@/lib/social/publisher';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const results = await publishDuePosts();

    return res.status(200).json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
}

// Prevent timeout on Vercel
export const config = {
  maxDuration: 300, // 5 minutes
};
