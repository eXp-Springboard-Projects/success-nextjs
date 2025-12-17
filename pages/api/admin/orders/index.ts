/**
 * API: Get all orders with fulfillment status
 * Filter by status, source, fulfillment status
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

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  if (req.method === 'GET') {
    try {
      const {
        status,
        orderSource,
        fulfillmentStatus,
        search,
        page = '1',
        limit = '50',
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      // Build where clause
      const where: any = {};

      if (status && status !== 'all') {
        where.status = status;
      }

      if (orderSource && orderSource !== 'all') {
        where.orderSource = orderSource;
      }

      if (fulfillmentStatus && fulfillmentStatus !== 'all') {
        where.fulfillmentStatus = fulfillmentStatus;
      }

      if (search) {
        where.OR = [
          { orderNumber: { contains: search as string, mode: 'insensitive' } },
          { userName: { contains: search as string, mode: 'insensitive' } },
          { userEmail: { contains: search as string, mode: 'insensitive' } },
          { trackingNumber: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Get orders
      const orders = await prisma.orders.findMany({
        where,
        skip,
        take,
        include: {
          order_items: {
            include: {
              products: true,
            },
          },
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Get total count for pagination
      const total = await prisma.orders.count({ where });

      // Transform data
      type OrderWithItems = typeof orders[number];
      type OrderItem = OrderWithItems['order_items'][number];
      const transformedOrders = orders.map((order: OrderWithItems) => ({
        ...order,
        total: order.total.toNumber(),
        subtotal: order.subtotal.toNumber(),
        tax: order.tax.toNumber(),
        shipping: order.shipping.toNumber(),
        discount: order.discount.toNumber(),
        order_items: order.order_items.map((item: OrderItem) => ({
          ...item,
          price: item.price.toNumber(),
          total: item.total.toNumber(),
        })),
      }));

      return res.status(200).json({
        orders: transformedOrders,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
