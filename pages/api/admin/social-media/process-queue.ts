import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { postToSocialMedia } from '../../../../lib/social-media-poster';

/**
 * Process Social Media Queue
 *
 * This endpoint should be called by a cron job to process scheduled posts.
 * It finds posts that are scheduled for the current time and posts them.
 *
 * Security: Should be protected by a secret token in production
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Simple authentication - in production, use a secret token
  const authToken = req.headers.authorization?.replace('Bearer ', '');

  if (authToken !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Find posts scheduled for now or earlier that haven't been posted yet
    const scheduledPosts = await prisma.$queryRaw<Array<{
      id: string;
      user_id: string;
    }>>`
      SELECT id, user_id
      FROM social_posts
      WHERE status = 'SCHEDULED'
        AND scheduled_at <= CURRENT_TIMESTAMP
      LIMIT 100
    `;

    if (scheduledPosts.length === 0) {
      return res.status(200).json({
        success: true,
        processed: 0,
        message: 'No posts to process',
      });
    }

    // Update status to POSTING to prevent duplicate processing
    const postIds = scheduledPosts.map((p: any) => p.id);
    await prisma.$executeRaw`
      UPDATE social_posts
      SET status = 'POSTING', updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY(ARRAY[${postIds.join(',')}]::TEXT[])
    `;

    // Process each post
    const results = await Promise.allSettled(
      scheduledPosts.map(post =>
        postToSocialMedia(post.id, post.user_id)
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return res.status(200).json({
      success: true,
      processed: scheduledPosts.length,
      successful,
      failed,
    });

  } catch (error: any) {
    console.error('Error processing queue:', error);
    return res.status(500).json({
      error: 'Failed to process queue',
      message: error.message,
    });
  }
}
