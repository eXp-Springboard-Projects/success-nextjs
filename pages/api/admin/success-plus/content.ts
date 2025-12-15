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

      // Build filter for premium content based on categories
      const where: any = {
        categories: {
          some: {
            OR: [
              { slug: 'success-plus' },
              { slug: 'insider' },
              { slug: 'premium' },
            ],
          },
        },
      };

      // Apply content type filter (maps to category slugs)
      if (contentType && contentType !== 'all') {
        if (contentType === 'premium') {
          where.categories = {
            some: { slug: 'success-plus' },
          };
        } else if (contentType === 'insider') {
          where.categories = {
            some: { slug: 'insider' },
          };
        }
      }

      // Apply status filter
      if (status && status !== 'all') {
        where.status = status.toString().toUpperCase();
      }

      const posts = await prisma.posts.findMany({
        where,
        include: {
          categories: {
            select: {
              name: true,
              slug: true,
            },
          },
          users: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: 100,
      });

      return res.status(200).json({
        posts: posts.map((post) => {
          // Determine content type and access tier based on categories
          const categorySlugslower = post.categories.map(c => c.slug.toLowerCase());
          const isInsider = categorySlugslower.includes('insider');
          const isPremium = categorySlugslower.includes('success-plus') || categorySlugslower.includes('premium');

          return {
            id: post.id,
            title: post.title,
            slug: post.slug,
            status: post.status,
            contentType: isInsider ? 'insider' : 'premium',
            accessTier: isInsider ? 'insider' : 'success_plus',
            publishedAt: post.publishedAt,
            author: {
              name: post.users?.name || post.wordpressAuthor || 'Unknown',
              email: post.users?.email || '',
            },
            categories: post.categories,
          };
        }),
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
