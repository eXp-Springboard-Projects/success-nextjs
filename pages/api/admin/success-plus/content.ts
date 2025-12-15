import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has admin or SUCCESS_PLUS department access
    const user = await prisma.users.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.primaryDepartment !== 'SUCCESS_PLUS')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'GET') {
      const { contentType, status } = req.query;

      // Build filter for premium content
      const where: any = {
        OR: [
          { contentType: 'premium' },
          { contentType: 'insider' },
          { isPremium: true },
          { isInsiderOnly: true },
        ],
      };

      // Apply content type filter
      if (contentType && contentType !== 'all') {
        where.contentType = contentType;
      }

      // Apply status filter
      if (status && status !== 'all') {
        where.status = status.toString().toUpperCase();
      }

      const posts = await prisma.posts.findMany({
        where,
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
          categories: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

      return res.status(200).json({
        posts: posts.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          contentType: post.contentType || 'regular',
          accessTier: post.accessTier || 'free',
          publishedAt: post.publishedAt,
          author: post.author,
          categories: post.categories,
        })),
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Premium content API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
