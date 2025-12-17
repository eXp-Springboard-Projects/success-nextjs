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

  if (req.method === 'GET') {
    try {
      const {
        per_page = '20',
        page = '1',
        status = 'all',
        search,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(per_page as string);
      const take = parseInt(per_page as string);

      const where: any = {};

      if (status && status !== 'all') {
        where.status = status.toString().toUpperCase();
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { content: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const pages = await prisma.pages.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      });

      const total = await prisma.pages.count({ where });

      res.setHeader('X-Total-Count', total.toString());
      res.setHeader('X-Total-Pages', Math.ceil(total / take).toString());

      return res.status(200).json(pages);
    } catch (error: any) {
      console.error('Error fetching pages:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        title,
        slug,
        content,
        status = 'DRAFT',
        seoTitle,
        seoDescription,
        featuredImage,
        featuredImageAlt,
        template,
        parentId,
        order = 0,
      } = req.body;

      if (!title || !slug || !content) {
        return res.status(400).json({ error: 'Title, slug, and content are required' });
      }

      // Check for duplicate slug
      const existing = await prisma.pages.findUnique({
        where: { slug },
      });

      if (existing) {
        return res.status(409).json({ error: 'Page with this slug already exists' });
      }

      const page = await prisma.pages.create({
        data: {
          id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title,
          slug,
          content,
          status: status.toUpperCase(),
          publishedAt: status.toUpperCase() === 'PUBLISHED' ? new Date() : null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          featuredImage: featuredImage || null,
          featuredImageAlt: featuredImageAlt || null,
          template: template || null,
          parentId: parentId || null,
          order: parseInt(order),
        },
      });

      // Log activity
      await prisma.activity_logs.create({
        data: {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          action: 'CREATE',
          entity: 'page',
          entityId: page.id,
          details: JSON.stringify({ title: page.title, slug: page.slug }),
        },
      });

      return res.status(201).json(page);
    } catch (error: any) {
      console.error('Error creating page:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
