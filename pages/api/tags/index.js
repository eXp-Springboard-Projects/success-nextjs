import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getTags(req, res);
    case 'POST':
      return createTag(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getTags(req, res) {
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

    const tags = await prisma.tags.findMany({
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

    const total = await prisma.tags.count({ where });

    res.setHeader('X-WP-Total', total);
    res.setHeader('X-WP-TotalPages', Math.ceil(total / take));

    // Transform to WordPress-like format
    const transformedTags = tags.map(tag => ({
      id: tag.id,
      count: tag._count.posts,
      name: tag.name,
      slug: tag.slug,
      _count: tag._count,
    }));

    return res.status(200).json(transformedTags);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function createTag(req, res) {
  try {
    const { name, slug } = req.body;

    const tag = await prisma.tags.create({
      data: {
        name,
        slug,
      },
    });

    return res.status(201).json(tag);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
