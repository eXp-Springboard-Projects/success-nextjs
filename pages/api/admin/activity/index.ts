import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

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

    const {
      department,
      type,
      userId,
      startDate,
      endDate,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (department && department !== 'all') {
      where.department = department;
    }

    if (type) {
      where.entityType = type;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    // Fetch activities
    const [activities, total] = await Promise.all([
      prisma.staff_activity_feed.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        take: limitNum,
        skip,
      }),
      prisma.staff_activity_feed.count({ where })
    ]);

    const response = {
      activities: activities.map(activity => ({
        id: activity.id,
        userName: activity.userName,
        action: activity.action,
        description: activity.description,
        entityType: activity.entityType,
        department: activity.department,
        createdAt: activity.createdAt.toISOString(),
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
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
