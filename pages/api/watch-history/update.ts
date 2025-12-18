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

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
      contentType,
      contentId,
      contentTitle,
      contentUrl,
      thumbnail,
      duration,
      position,
      completed,
    } = req.body;

    // Validate required fields
    if (!contentType || !contentId || !contentTitle || !contentUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (contentType !== 'video' && contentType !== 'podcast') {
      return res.status(400).json({ error: 'contentType must be either "video" or "podcast"' });
    }

    // Upsert watch history record
    const watchHistory = await prisma.watch_history.upsert({
      where: {
        userId_contentType_contentId: {
          userId: session.user.id,
          contentType,
          contentId,
        },
      },
      create: {
        userId: session.user.id,
        contentType,
        contentId,
        contentTitle,
        contentUrl,
        thumbnail,
        duration,
        position: position || 0,
        completed: completed || false,
        lastWatchedAt: new Date(),
      },
      update: {
        position: position || 0,
        completed: completed || false,
        lastWatchedAt: new Date(),
        ...(duration && { duration }),
        ...(thumbnail && { thumbnail }),
      },
    });

    return res.status(200).json({
      message: 'Watch progress saved',
      watchHistory,
    });
  } catch (error) {
    console.error('Watch history update API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
