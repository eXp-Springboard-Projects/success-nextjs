import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const {
        page = '1',
        per_page = '100',
        status = 'all',
        search = '',
        author = 'all',
        category = 'all'
      } = req.query;

      const pageNum = parseInt(page as string);
      const perPage = parseInt(per_page as string);
      const skip = (pageNum - 1) * perPage;

      // Build where clause
      const where: any = {};

      if (status !== 'all') {
        where.status = status.toString().toUpperCase();
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { slug: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      if (author !== 'all') {
        where.authorId = author;
      }

      if (category !== 'all') {
        where.categories = {
          some: { id: category as string }
        };
      }

      // Fetch posts with relations
      const [posts, total] = await Promise.all([
        prisma.posts.findMany({
          where,
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            },
            categories: {
              select: {
                id: true,
                name: true,
                slug: true,
              }
            },
            tags: {
              select: {
                id: true,
                name: true,
                slug: true,
              }
            },
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: perPage,
        }),
        prisma.posts.count({ where })
      ]);

      // Format response similar to WordPress API
      const formattedPosts = posts.map(post => ({
        id: post.id,
        title: { rendered: post.title },
        slug: post.slug,
        content: { rendered: post.content },
        excerpt: { rendered: post.excerpt || '' },
        status: post.status.toLowerCase(),
        date: post.publishedAt || post.createdAt,
        modified: post.updatedAt,
        featured_media: post.featuredImage ? {
          source_url: post.featuredImage,
          alt_text: post.featuredImageAlt || '',
        } : null,
        _embedded: {
          author: [{
            id: post.users.id,
            name: post.users.name,
            email: post.users.email,
          }],
          'wp:term': [
            post.categories.map(cat => ({
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              taxonomy: 'category'
            })),
            post.tags.map(tag => ({
              id: tag.id,
              name: tag.name,
              slug: tag.slug,
              taxonomy: 'post_tag'
            }))
          ]
        }
      }));

      // Add pagination headers
      res.setHeader('X-WP-Total', total.toString());
      res.setHeader('X-WP-TotalPages', Math.ceil(total / perPage).toString());

      return res.status(200).json(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        title,
        slug,
        content,
        excerpt,
        status,
        featuredImage,
        featuredImageAlt,
        seoTitle,
        seoDescription,
        categories: categoryIds,
        tags: tagIds,
        authorId,
        publishedAt
      } = req.body;

      // Create new post
      const newPost = await prisma.posts.create({
        data: {
          id: `post_${Date.now()}`,
          title,
          slug,
          content,
          excerpt: excerpt || '',
          status: status?.toUpperCase() || 'DRAFT',
          featuredImage,
          featuredImageAlt,
          seoTitle,
          seoDescription,
          authorId: authorId || session.user.id,
          publishedAt: status === 'PUBLISHED' || status === 'published'
            ? (publishedAt ? new Date(publishedAt) : new Date())
            : null,
          categories: categoryIds && categoryIds.length > 0 ? {
            connect: categoryIds.map((catId: string) => ({ id: catId }))
          } : undefined,
          tags: tagIds && tagIds.length > 0 ? {
            connect: tagIds.map((tagId: string) => ({ id: tagId }))
          } : undefined,
        },
        include: {
          users: true,
          categories: true,
          tags: true,
        }
      });

      // Create initial revision
      await prisma.post_revisions.create({
        data: {
          id: `rev_${Date.now()}`,
          postId: newPost.id,
          title: newPost.title,
          content: newPost.content,
          excerpt: newPost.excerpt,
          featuredImage: newPost.featuredImage,
          featuredImageAlt: newPost.featuredImageAlt,
          status: newPost.status,
          seoTitle: newPost.seoTitle,
          seoDescription: newPost.seoDescription,
          authorId: session.user.id,
          authorName: session.user.name || 'Unknown',
          changeNote: 'Initial version',
        }
      });

      return res.status(201).json({
        success: true,
        id: newPost.id,
        post: {
          id: newPost.id,
          title: newPost.title,
          slug: newPost.slug,
          status: newPost.status,
        }
      });
    } catch (error) {
      console.error('Error creating post:', error);
      return res.status(500).json({ error: 'Failed to create post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
