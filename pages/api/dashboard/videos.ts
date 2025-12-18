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

    // Check if user has SUCCESS+ subscription
    const user = await prisma.users.findUnique({
      where: { email: session.user.email! },
      include: { member: { include: { subscriptions: true } } },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hasActiveSubscription = user.member?.subscriptions?.some(s => s.status === 'ACTIVE');

    if (!hasActiveSubscription) {
      return res.status(403).json({ error: 'SUCCESS+ subscription required' });
    }

    if (req.method === 'GET') {
      // Get all published videos
      const videos = await prisma.videos.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
      });

      return res.status(200).json(videos);
    }

    if (req.method === 'POST') {
      // Update watch progress
      const { videoId, progress, completed } = req.body;

      if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required' });
      }

      // Check if video exists
      const video = await prisma.videos.findUnique({
        where: { id: videoId },
      });

      if (!video || video.status !== 'PUBLISHED') {
        return res.status(404).json({ error: 'Video not found' });
      }

      // Feature coming soon
      return res.status(200).json({ message: 'Watch history tracking coming soon' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
