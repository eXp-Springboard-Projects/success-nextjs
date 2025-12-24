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
    if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, Department.EDITORIAL)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Fetch dashboard stats
    const [
      publishedThisWeek,
      drafts,
      scheduled,
      pendingReview,
      totalArticles,
      totalAuthors,
      recentActivity,
      upcomingPublications
    ] = await Promise.all([
      // Published this week
      prisma.posts.count({
        where: {
          status: 'PUBLISHED',
          publishedAt: {
            gte: oneWeekAgo
          }
        }
      }),

      // Drafts
      prisma.posts.count({
        where: {
          status: 'DRAFT'
        }
      }),

      // Scheduled posts
      prisma.editorial_calendar.count({
        where: {
          status: 'SCHEDULED',
          scheduledDate: {
            gte: now
          }
        }
      }),

      // Pending review (using editorial calendar status)
      prisma.editorial_calendar.count({
        where: {
          status: 'IN_REVIEW'
        }
      }),

      // Total articles
      prisma.posts.count({
        where: {
          status: 'PUBLISHED'
        }
      }),

      // Total authors (users with AUTHOR or EDITOR role)
      prisma.users.count({
        where: {
          role: {
            in: ['AUTHOR', 'EDITOR']
          }
        }
      }),

      // Recent activity from staff activity feed
      prisma.staff_activity_feed.findMany({
        where: {
          department: Department.EDITORIAL
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }),

      // Upcoming publications (next 7 days)
      prisma.editorial_calendar.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledDate: {
            gte: now,
            lte: sevenDaysFromNow
          }
        },
        include: {
          users: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          scheduledDate: 'asc'
        },
        take: 10
      })
    ]);

    const stats = {
      publishedThisWeek,
      drafts,
      scheduled,
      pendingReview,
      totalArticles,
      totalAuthors,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.entityType?.toLowerCase() || 'post',
        description: activity.description || activity.action,
        timestamp: activity.createdAt.toISOString(),
        user: activity.userName
      })),
      upcomingPublications: upcomingPublications.map(pub => ({
        id: pub.id,
        title: pub.title,
        author: pub.users?.name || 'Unknown',
        scheduledDate: pub.scheduledDate?.toISOString() || '',
        category: pub.categoryId || 'Uncategorized'
      }))
    };

    return res.status(200).json(stats);

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
