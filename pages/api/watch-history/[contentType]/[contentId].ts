import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';


const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { contentType, contentId } = req.query;

    if (!contentType || !contentId) {
      return res.status(400).json({ error: 'Missing contentType or contentId' });
    }

    if (contentType !== 'video' && contentType !== 'podcast') {
      return res.status(400).json({ error: 'contentType must be either "video" or "podcast"' });
    }

    if (req.method === 'GET') {
      // Get watch history for specific content
      const watchHistory = await prisma.watch_history.findUnique({
        where: {
          userId_contentType_contentId: {
            userId: session.user.id,
            contentType: contentType as string,
            contentId: contentId as string,
          },
        },
      });

      if (!watchHistory) {
        return res.status(404).json({ error: 'Watch history not found' });
      }

      // Calculate progress percentage
      const progressPercent = watchHistory.duration && watchHistory.duration > 0
        ? Math.round((watchHistory.position / watchHistory.duration) * 100)
        : 0;

      return res.status(200).json({
        ...watchHistory,
        progressPercent,
      });
    }

    if (req.method === 'DELETE') {
      // Delete watch history
      await prisma.watch_history.delete({
        where: {
          userId_contentType_contentId: {
            userId: session.user.id,
            contentType: contentType as string,
            contentId: contentId as string,
          },
        },
      });

      return res.status(200).json({
        message: 'Watch history deleted',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Watch history item API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
