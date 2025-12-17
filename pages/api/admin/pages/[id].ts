import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid page ID' });
  }

  if (req.method === 'GET') {
    try {
      const page = await prisma.pages.findUnique({
        where: { id },
      });

      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      return res.status(200).json(page);
    } catch (error: any) {
      console.error('Error fetching page:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const {
        title,
        slug,
        content,
        status,
        seoTitle,
        seoDescription,
        featuredImage,
        featuredImageAlt,
        template,
        parentId,
        order,
      } = req.body;

      // Check if slug is being changed and if it conflicts
      if (slug) {
        const existing = await prisma.pages.findFirst({
          where: {
            slug,
            NOT: { id },
          },
        });

        if (existing) {
          return res.status(409).json({ error: 'Page with this slug already exists' });
        }
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (title !== undefined) updateData.title = title;
      if (slug !== undefined) updateData.slug = slug;
      if (content !== undefined) updateData.content = content;
      if (status !== undefined) {
        updateData.status = status.toUpperCase();
        if (status.toUpperCase() === 'PUBLISHED') {
          updateData.publishedAt = new Date();
        }
      }
      if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
      if (seoDescription !== undefined) updateData.seoDescription = seoDescription;
      if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
      if (featuredImageAlt !== undefined) updateData.featuredImageAlt = featuredImageAlt;
      if (template !== undefined) updateData.template = template;
      if (parentId !== undefined) updateData.parentId = parentId;
      if (order !== undefined) updateData.order = parseInt(order);

      const page = await prisma.pages.update({
        where: { id },
        data: updateData,
      });

      // Log activity
      await prisma.activity_logs.create({
        data: {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          action: 'UPDATE',
          entity: 'page',
          entityId: page.id,
          details: JSON.stringify({ title: page.title, slug: page.slug }),
        },
      });

      return res.status(200).json(page);
    } catch (error: any) {
      console.error('Error updating page:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.pages.delete({
        where: { id },
      });

      // Log activity
      await prisma.activity_logs.create({
        data: {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          action: 'DELETE',
          entity: 'page',
          entityId: id,
        },
      });

      return res.status(200).json({ message: 'Page deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting page:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
