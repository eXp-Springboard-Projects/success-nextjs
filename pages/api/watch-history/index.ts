import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { contentType, limit = '20', onlyInProgress } = req.query;

    const where: any = {
      userId: session.user.id,
    };

    // Filter by content type if provided
    if (contentType && (contentType === 'video' || contentType === 'podcast')) {
      where.contentType = contentType;
    }

    // Filter for in-progress items only
    if (onlyInProgress === 'true') {
      where.completed = false;
      where.position = { gt: 0 };
    }

    const watchHistory = await prisma.watch_history.findMany({
      where,
      orderBy: {
        lastWatchedAt: 'desc',
      },
      take: parseInt(limit as string),
    });

    // Calculate progress percentage
    const historyWithProgress = watchHistory.map((item) => ({
      ...item,
      progressPercent: item.duration && item.duration > 0
        ? Math.round((item.position / item.duration) * 100)
        : 0,
    }));

    return res.status(200).json({
      watchHistory: historyWithProgress,
      total: watchHistory.length,
    });
  } catch (error) {
    console.error('Watch history API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
