import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getCategories(req, res);
    case 'POST':
      return createCategory(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getCategories(req, res) {
  try {
    const {
      per_page = 50,
      page = 1,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(per_page);
    const take = parseInt(per_page);

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const categories = await prisma.categories.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    const total = await prisma.categories.count({ where });

    res.setHeader('X-WP-Total', total);
    res.setHeader('X-WP-TotalPages', Math.ceil(total / take));

    // Transform to WordPress-like format
    const transformedCategories = categories.map(cat => ({
      id: cat.id,
      count: cat._count.posts,
      description: cat.description || '',
      name: cat.name,
      slug: cat.slug,
    }));

    return res.status(200).json(transformedCategories);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function createCategory(req, res) {
  try {
    const { name, slug, description } = req.body;

    const category = await prisma.categories.create({
      data: {
        name,
        slug,
        description,
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
