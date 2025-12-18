import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
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

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const post = await prisma.posts.findUnique({
        where: { id: id as string },
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
        }
      });

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Format response similar to WordPress API
      const formattedPost = {
        id: post.id,
        title: { rendered: post.title },
        slug: post.slug,
        content: { rendered: post.content },
        excerpt: { rendered: post.excerpt || '' },
        status: post.status.toLowerCase(),
        date: post.publishedAt || post.createdAt,
        modified: post.updatedAt,
        featured_media_url: post.featuredImage || '',
        featuredImageAlt: post.featuredImageAlt || '',
        seoTitle: post.seoTitle || '',
        seoDescription: post.seoDescription || '',
        readTime: post.readTime || 0,
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
          ],
          'wp:featuredmedia': post.featuredImage ? [{
            source_url: post.featuredImage,
            alt_text: post.featuredImageAlt || '',
          }] : []
        },
        categories: post.categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug
        })),
        tags: post.tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug
        }))
      };

      return res.status(200).json(formattedPost);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch post' });
    }
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
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
        publishedAt
      } = req.body;

      // Update post
      const currentPost = await prisma.posts.findUnique({
        where: { id: id as string },
        select: { publishedAt: true }
      });

      const newStatus = status?.toUpperCase() || 'DRAFT';
      const isBeingPublished = newStatus === 'PUBLISHED' || newStatus === 'PUBLISH';

      const updatedPost = await prisma.posts.update({
        where: { id: id as string },
        data: {
          title,
          slug,
          content,
          excerpt,
          status: newStatus,
          featuredImage,
          featuredImageAlt,
          seoTitle,
          seoDescription,
          publishedAt: isBeingPublished
            ? (publishedAt ? new Date(publishedAt) : (currentPost?.publishedAt || new Date()))
            : undefined,
          categories: categoryIds ? {
            set: categoryIds.map((catId: string) => ({ id: catId }))
          } : undefined,
          tags: tagIds ? {
            set: tagIds.map((tagId: string) => ({ id: tagId }))
          } : undefined,
        },
        include: {
          users: true,
          categories: true,
          tags: true,
        }
      });

      // Create revision
      await prisma.post_revisions.create({
        data: {
          id: `rev_${Date.now()}`,
          postId: updatedPost.id,
          title: updatedPost.title,
          content: updatedPost.content,
          excerpt: updatedPost.excerpt,
          featuredImage: updatedPost.featuredImage,
          featuredImageAlt: updatedPost.featuredImageAlt,
          status: updatedPost.status,
          seoTitle: updatedPost.seoTitle,
          seoDescription: updatedPost.seoDescription,
          authorId: session.user.id,
          authorName: session.user.name || 'Unknown',
          changeNote: 'Updated via admin editor',
        }
      });

      return res.status(200).json({
        success: true,
        post: {
          id: updatedPost.id,
          title: updatedPost.title,
          slug: updatedPost.slug,
          status: updatedPost.status,
        }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update post' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.posts.delete({
        where: { id: id as string }
      });

      return res.status(200).json({ success: true, message: 'Post deleted' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
