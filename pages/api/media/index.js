import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getMedia(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getMedia(req, res) {
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
        { filename: { contains: search, mode: 'insensitive' } },
        { alt: { contains: search, mode: 'insensitive' } },
      ];
    }

    const media = await prisma.media.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.media.count({ where });

    res.setHeader('X-WP-Total', total);
    res.setHeader('X-WP-TotalPages', Math.ceil(total / take));

    return res.status(200).json(media);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
