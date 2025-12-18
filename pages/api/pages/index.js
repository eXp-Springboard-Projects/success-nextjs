import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getPages(req, res);
    case 'POST':
      return createPage(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getPages(req, res) {
  try {
    const {
      per_page = 50,
      page = 1,
      status,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(per_page);
    const take = parseInt(per_page);

    const where = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pages = await prisma.pages.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.pages.count({ where });

    res.setHeader('X-WP-Total', total);
    res.setHeader('X-WP-TotalPages', Math.ceil(total / take));

    return res.status(200).json(pages);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function createPage(req, res) {
  try {
    const { title, slug, content, status, seoTitle, seoDescription, publishedAt } = req.body;

    const page = await prisma.pages.create({
      data: {
        title,
        slug,
        content,
        status: status || 'DRAFT',
        seoTitle,
        seoDescription,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      },
    });

    return res.status(201).json(page);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
