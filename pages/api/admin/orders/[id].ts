/**
 * API Endpoint: /api/admin/orders/[id]
 * Update order status
 */
import type { NextApiRequest, NextApiResponse } from 'next';
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

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid order ID' });
  }

  if (req.method === 'PATCH') {
    try {
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const order = await prisma.orders.update({
        where: { id },
        data: {
          status: status.toUpperCase(),
          updatedAt: new Date(),
        },
      });

      return res.status(200).json(order);
    } catch (error: any) {
      console.error('Order update error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
