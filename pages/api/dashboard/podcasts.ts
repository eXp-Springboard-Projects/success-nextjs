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
      // Get all published podcasts
      const podcasts = await prisma.podcasts.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
      });

      return res.status(200).json(podcasts);
    }

    if (req.method === 'POST') {
      // Update listen progress
      const { podcastId, progress, completed } = req.body;

      if (!podcastId) {
        return res.status(400).json({ error: 'Podcast ID is required' });
      }

      // Check if podcast exists
      const podcast = await prisma.podcasts.findUnique({
        where: { id: podcastId },
      });

      if (!podcast || podcast.status !== 'PUBLISHED') {
        return res.status(404).json({ error: 'Podcast not found' });
      }

      // Feature coming soon
      return res.status(200).json({ message: 'Listen history tracking coming soon' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
