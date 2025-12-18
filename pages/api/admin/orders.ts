/**
 * API Endpoint: /api/admin/orders
 * Get all orders with filtering
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { status, search } = req.query;

    const where: any = {};

    // Filter by status
    if (status && status !== 'all') {
      where.status = status.toString().toUpperCase();
    }

    // Search filter
    if (search && search !== '') {
      where.OR = [
        { orderNumber: { contains: search.toString(), mode: 'insensitive' } },
        { userName: { contains: search.toString(), mode: 'insensitive' } },
        { userEmail: { contains: search.toString(), mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.orders.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.status(200).json(orders);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
