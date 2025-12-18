import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Track paywall analytics
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { articleId, articleTitle, articleUrl, blocked, userId } = req.body;

    // You can extend this to log to a separate analytics table
    // For now, we're just acknowledging the event

    // Could also send to external analytics service
    // await sendToGoogleAnalytics({ ... });
    // await sendToSegment({ ... });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
