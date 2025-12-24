import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { Department } from '@/lib/types';
import { PrismaClient } from '@prisma/client';
import { hasDepartmentAccess } from '@/lib/departmentAuth';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req }) as any;

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check department access
    if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, Department.CUSTOMER_SERVICE)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Fetch dashboard stats
    const [
      activeSubscriptions,
      failedPayments,
      refundsToday,
      recentActivity
    ] = await Promise.all([
      // Active subscriptions count
      prisma.subscriptions.count({
        where: {
          status: 'active'
        }
      }),

      // Failed payment attempts from webhook logs
      prisma.webhook_logs.count({
        where: {
          status: 'Failed',
          eventType: 'invoice.payment_failed',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),

      // Refunds today
      prisma.refund_disputes.count({
        where: {
          type: 'REFUND',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),

      // Recent activity from staff activity feed
      prisma.staff_activity_feed.findMany({
        where: {
          department: Department.CUSTOMER_SERVICE
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    ]);

    // Get pending items (failed payments that need attention)
    const pendingFailedPayments = await prisma.webhook_logs.findMany({
      where: {
        status: 'Failed',
        eventType: 'invoice.payment_failed',
        attempts: {
          lt: 3
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Get open refund disputes
    const openDisputes = await prisma.refund_disputes.findMany({
      where: {
        status: {
          in: ['OPEN', 'IN_PROGRESS']
        }
      },
      orderBy: {
        priority: 'desc'
      },
      take: 5
    });

    const pendingItems = [
      ...pendingFailedPayments.map(payment => ({
        id: payment.id,
        type: 'Failed Payment',
        description: `Payment failed for ${payment.provider} - ${payment.eventId || 'Unknown'}`,
        priority: 'high' as const
      })),
      ...openDisputes.map(dispute => ({
        id: dispute.id,
        type: 'Refund Dispute',
        description: dispute.description || 'Dispute requires attention',
        priority: dispute.priority.toLowerCase() as 'high' | 'medium' | 'low'
      }))
    ];

    const stats = {
      activeSubscriptions,
      openTickets: openDisputes.length, // Using refund disputes as "tickets"
      refundsToday,
      failedPayments,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.entityType?.toLowerCase() || 'unknown',
        description: activity.description || activity.action,
        timestamp: activity.createdAt.toISOString(),
        user: activity.userName
      })),
      pendingItems: pendingItems.slice(0, 10)
    };

    return res.status(200).json(stats);

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
