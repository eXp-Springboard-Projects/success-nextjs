import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { prisma } from '../../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Get all posts for the user
      const posts = await prisma.$queryRaw`
        SELECT
          p.id, p.user_id, p.content, p.image_url, p.link_url,
          p.platforms, p.status, p.scheduled_at, p.posted_at,
          p.auto_generated, p.created_at,
          COALESCE(
            json_agg(
              json_build_object(
                'platform', r.platform,
                'success', r.success,
                'errorMessage', r.error_message,
                'platformPostUrl', r.platform_post_url
              )
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'
          ) as results
        FROM social_posts p
        LEFT JOIN social_post_results r ON r.post_id = p.id
        WHERE p.user_id = ${session.user.id}
        GROUP BY p.id
        ORDER BY
          CASE
            WHEN p.status = 'SCHEDULED' THEN 1
            WHEN p.status = 'DRAFT' THEN 2
            ELSE 3
          END,
          COALESCE(p.scheduled_at, p.created_at) DESC
      `;

      return res.status(200).json({ posts });
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { content, imageUrl, linkUrl, platforms, scheduledAt, postNow } = req.body;

      if (!content || !platforms || platforms.length === 0) {
        return res.status(400).json({ error: 'Content and platforms are required' });
      }

      // Create post
      const result = await prisma.$queryRaw<Array<{ id: string }>>`
        INSERT INTO social_posts (
          id, user_id, content, image_url, link_url, platforms,
          status, scheduled_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid()::TEXT,
          ${session.user.id},
          ${content},
          ${imageUrl || null},
          ${linkUrl || null},
          ${platforms}::TEXT[],
          ${postNow ? 'POSTING' : scheduledAt ? 'SCHEDULED' : 'DRAFT'},
          ${scheduledAt || null}::TIMESTAMP,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING id
      `;

      const postId = result[0]?.id;

      if (postNow) {
        // TODO: Trigger posting job
        // For now, we'll just mark it as POSTING
        // In production, this would call a background job to actually post to the platforms
      }

      return res.status(201).json({
        success: true,
        postId,
        message: postNow ? 'Post is being published' : 'Post scheduled successfully'
      });
    } catch (error: any) {
      console.error('Error creating post:', error);
      return res.status(500).json({ error: 'Failed to create post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
