import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getSubscriptions(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getSubscriptions(req, res) {
  try {
    const { status, per_page = 50, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(per_page);
    const take = parseInt(per_page);

    const where = status && status !== 'all' ? { status: status.toUpperCase() } : {};

    const subscriptions = await prisma.subscriptions.findMany({
      where,
      skip,
      take,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.subscriptions.count({ where });

    res.setHeader('X-WP-Total', total);
    res.setHeader('X-WP-TotalPages', Math.ceil(total / take));

    return res.status(200).json(subscriptions);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
