/**
 * API Endpoint: /api/admin/sales-cs/dashboard
 * Returns aggregated stats for Sales & CS dashboard
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get date range (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total revenue from all orders
    const ordersRevenue = await prisma.orders.aggregate({
      _sum: {
        total: true,
      },
      where: {
        status: {
          in: ['COMPLETED', 'PENDING', 'PROCESSING'],
        },
      },
    });

    // Monthly revenue (last 30 days)
    const monthlyOrdersRevenue = await prisma.orders.aggregate({
      _sum: {
        total: true,
      },
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
        status: {
          in: ['COMPLETED', 'PENDING', 'PROCESSING'],
        },
      },
    });

    // Active subscriptions count
    const activeSubscriptions = await prisma.subscriptions.count({
      where: {
        status: 'active',
      },
    });

    // Total customers (users)
    const totalCustomers = await prisma.users.count();

    // Pending orders
    const pendingOrders = await prisma.orders.count({
      where: {
        status: 'PENDING',
      },
    });

    // Email subscribers
    const emailSubscribers = await prisma.email_subscribers.count({
      where: {
        status: 'ACTIVE',
      },
    });

    // Average order value
    const completedOrders = await prisma.orders.aggregate({
      _avg: {
        total: true,
      },
      where: {
        status: 'COMPLETED',
      },
    });

    // Calculate churn rate (subscriptions canceled in last 30 days / total subscriptions)
    const canceledSubscriptions = await prisma.subscriptions.count({
      where: {
        status: 'canceled',
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const totalSubscriptions = await prisma.subscriptions.count();
    const churnRate = totalSubscriptions > 0
      ? (canceledSubscriptions / totalSubscriptions) * 100
      : 0;

    const stats = {
      totalRevenue: parseFloat(ordersRevenue._sum.total?.toString() || '0'),
      monthlyRevenue: parseFloat(monthlyOrdersRevenue._sum.total?.toString() || '0'),
      activeSubscriptions,
      totalCustomers,
      pendingOrders,
      emailSubscribers,
      averageOrderValue: parseFloat(completedOrders._avg.total?.toString() || '0'),
      churnRate,
    };

    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Dashboard stats API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
