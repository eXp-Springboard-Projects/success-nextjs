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

    // Only admins can view all subscriptions
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'GET') {
      const { status, page = '1', limit = '50' } = req.query;

      const pageNumber = parseInt(page as string);
      const limitNumber = parseInt(limit as string);
      const skip = (pageNumber - 1) * limitNumber;

      // Build filter
      const where: any = {};
      if (status && status !== 'all') {
        where.status = status;
      }

      // Get subscriptions with member data
      const [subscriptions, total] = await Promise.all([
        prisma.subscriptions.findMany({
          where,
          skip,
          take: limitNumber,
          orderBy: { createdAt: 'desc' },
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                membershipTier: true,
                membershipStatus: true,
              },
            },
          },
        }),
        prisma.subscriptions.count({ where }),
      ]);

      return res.status(200).json({
        subscriptions,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(total / limitNumber),
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Subscriptions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
