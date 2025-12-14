import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
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
    if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, 'CUSTOMER_SERVICE')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const {
      search,
      status,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { users: { email: { contains: search as string, mode: 'insensitive' } } },
        { users: { name: { contains: search as string, mode: 'insensitive' } } },
        { stripeSubscriptionId: { contains: search as string } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    // Fetch subscriptions with member details
    const [subscriptions, total] = await Promise.all([
      prisma.subscriptions.findMany({
        where,
        include: {
          member: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limitNum,
        skip,
      }),
      prisma.subscriptions.count({ where })
    ]);

    const response = {
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        userId: sub.memberId,
        userName: sub.member ? `${sub.member.firstName} ${sub.member.lastName}` : 'Unknown',
        userEmail: sub.member?.email || 'Unknown',
        planName: sub.tier || 'Unknown Plan',
        status: sub.status || 'unknown',
        nextBillingDate: sub.currentPeriodEnd?.toISOString(),
        amount: 0, // TODO: Add amount field to subscriptions model
        interval: sub.billingCycle || 'month',
        stripeSubscriptionId: sub.stripeSubscriptionId,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
