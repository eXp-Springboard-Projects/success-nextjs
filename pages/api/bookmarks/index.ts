import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';
import { randomUUID } from 'crypto';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  // GET - Fetch user's bookmarks
  if (req.method === 'GET') {
    try {
      const bookmarks = await prisma.bookmarks.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json(bookmarks);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch bookmarks' });
    }
  }

  // POST - Create a new bookmark
  if (req.method === 'POST') {
    try {
      const { articleId, articleTitle, articleUrl, articleImage } = req.body;

      if (!articleId || !articleTitle || !articleUrl) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if bookmark already exists
      const existing = await prisma.bookmarks.findUnique({
        where: {
          userId_articleId: {
            userId,
            articleId,
          },
        },
      });

      if (existing) {
        return res.status(409).json({ error: 'Bookmark already exists' });
      }

      const bookmark = await prisma.bookmarks.create({
        data: {
          id: randomUUID(),
          userId,
          articleId,
          articleTitle,
          articleUrl,
          articleImage: articleImage || null,
        },
      });

      // Create activity log
      await prisma.user_activities.create({
        data: {
          id: randomUUID(),
          userId,
          activityType: 'ARTICLE_BOOKMARKED',
          title: `Bookmarked: ${articleTitle}`,
          metadata: JSON.stringify({ articleId, articleUrl }),
        },
      });

      return res.status(201).json(bookmark);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create bookmark' });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
