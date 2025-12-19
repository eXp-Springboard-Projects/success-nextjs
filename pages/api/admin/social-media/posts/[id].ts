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

  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      // Delete post (CASCADE will delete related results)
      await prisma.$executeRaw`
        DELETE FROM social_posts
        WHERE id = ${id as string}
        AND user_id = ${session.user.id}
      `;

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error deleting post:', error);
      return res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  if (req.method === 'GET') {
    try {
      // Get single post
      const posts = await prisma.$queryRaw`
        SELECT
          p.id, p.user_id, p.content, p.image_url, p.link_url,
          p.platforms, p.status, p.scheduled_at, p.posted_at,
          p.auto_generated, p.created_at
        FROM social_posts p
        WHERE p.id = ${id as string}
        AND p.user_id = ${session.user.id}
      `;

      if (!posts || (posts as any[]).length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      return res.status(200).json({ post: (posts as any[])[0] });
    } catch (error: any) {
      console.error('Error fetching post:', error);
      return res.status(500).json({ error: 'Failed to fetch post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
