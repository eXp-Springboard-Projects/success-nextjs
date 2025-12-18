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
      // Get all magazines with user's reading progress
      const magazines = await prisma.magazines.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const magazinesWithProgress = await Promise.all(
        magazines.map(async (magazine) => {
          const progress = await prisma.magazine_progress.findUnique({
            where: {
              userId_magazineId: {
                userId: user.id,
                magazineId: magazine.id,
              },
            },
          });

          return {
            ...magazine,
            currentPage: progress?.currentPage || 1,
            totalPages: progress?.totalPages || 100,
            completed: progress?.completed || false,
            lastReadAt: progress?.lastReadAt || null,
          };
        })
      );

      return res.status(200).json(magazinesWithProgress);
    }

    if (req.method === 'POST') {
      // Update reading progress
      const { magazineId, currentPage, totalPages, completed } = req.body;

      if (!magazineId) {
        return res.status(400).json({ error: 'Magazine ID is required' });
      }

      const progress = await prisma.magazine_progress.upsert({
        where: {
          userId_magazineId: {
            userId: user.id,
            magazineId,
          },
        },
        create: {
          userId: user.id,
          magazineId,
          currentPage: currentPage || 1,
          totalPages: totalPages || 100,
          completed: completed || false,
          lastReadAt: new Date(),
        },
        update: {
          currentPage: currentPage || 1,
          totalPages: totalPages || 100,
          completed: completed || false,
          lastReadAt: new Date(),
        },
      });

      return res.status(200).json(progress);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
