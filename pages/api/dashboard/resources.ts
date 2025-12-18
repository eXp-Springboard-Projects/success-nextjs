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
      const { category, search } = req.query;

      const where: any = { isPremium: true };

      if (category && category !== 'all') {
        where.category = category;
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const resources = await prisma.resources.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json(resources);
    }

    if (req.method === 'POST') {
      // Track resource download
      const { resourceId } = req.body;

      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID is required' });
      }

      // Increment download count
      const resource = await prisma.resources.update({
        where: { id: resourceId },
        data: {
          downloads: {
            increment: 1,
          },
        },
      });

      return res.status(200).json(resource);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
