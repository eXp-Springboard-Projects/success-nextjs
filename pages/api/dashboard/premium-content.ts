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

    // Check if user has active subscription
    const user = await prisma.users.findUnique({
      where: { email: session.user.email! },
      include: {
        member: {
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hasActiveSubscription = user.member?.subscriptions?.some(s => s.status === 'ACTIVE');

    if (!hasActiveSubscription) {
      return res.status(403).json({ error: 'SUCCESS+ subscription required' });
    }

    const { category, limit = '20', offset = '0' } = req.query;

    // Get premium posts (posts in SUCCESS+ category)
    const posts = await prisma.posts.findMany({
      where: {
        categories: {
          some: {
            OR: [
              { slug: 'success-plus' },
              { slug: 'insider' },
              { slug: 'premium' },
            ],
          },
        },
        status: 'PUBLISHED',
        ...(category && category !== 'all' && {
          categories: {
            some: {
              slug: category as string,
            },
          },
        }),
      },
      include: {
        categories: true,
        tags: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    // Get total count for pagination
    const totalCount = await prisma.posts.count({
      where: {
        categories: {
          some: {
            OR: [
              { slug: 'success-plus' },
              { slug: 'insider' },
              { slug: 'premium' },
            ],
          },
        },
        status: 'PUBLISHED',
        ...(category && category !== 'all' && {
          categories: {
            some: {
              slug: category as string,
            },
          },
        }),
      },
    });

    // Get user's bookmarked posts
    const bookmarks = await prisma.bookmarks.findMany({
      where: { userId: user.id },
      select: { articleId: true },
    });
    const bookmarkedIds = new Set(bookmarks.map(b => b.articleId));

    // Format posts for frontend
    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content?.substring(0, 200) + '...',
      featuredImage: post.featuredImage,
      featuredImageAlt: post.featuredImageAlt,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      readTime: post.readTime,
      wordpressId: post.wordpressId,
      isPremium: true, // All posts in this query are premium
      categories: post.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        color: cat.color,
      })),
      tags: post.tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
      isBookmarked: bookmarkedIds.has(post.id),
    }));

    return res.status(200).json({
      posts: formattedPosts,
      total: totalCount,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: parseInt(offset as string) + formattedPosts.length < totalCount,
    });
  } catch (error) {
    console.error('Premium content API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
