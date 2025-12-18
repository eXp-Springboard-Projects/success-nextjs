import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const { page = '1', limit = '20', isActive, targetAudience } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      if (targetAudience && targetAudience !== 'ALL') {
        where.targetAudience = targetAudience;
      }

      const [announcements, total] = await Promise.all([
        prisma.announcements.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: [
            { isPinned: 'desc' },
            { publishedAt: 'desc' },
          ],
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.announcements.count({ where }),
      ]);

      return res.status(200).json({
        announcements: announcements.map(a => ({
          ...a,
          createdBy: a.users.name,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    if (req.method === 'POST') {
      // Only Super Admin and Admin can create announcements
      if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const {
        title,
        content,
        type = 'INFO',
        priority = 'NORMAL',
        targetAudience = 'ALL',
        isActive = true,
        isPinned = false,
        publishedAt,
        expiresAt,
        dismissible = true,
        linkUrl,
        linkText,
      } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const announcement = await prisma.announcements.create({
        data: {
          title,
          content,
          type,
          priority,
          targetAudience,
          isActive,
          isPinned,
          publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          createdBy: session.user.id,
          dismissible,
          linkUrl,
          linkText,
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Log activity
      await prisma.activity_logs.create({
        data: {
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          action: 'ANNOUNCEMENT_CREATED',
          entity: 'announcements',
          entityId: announcement.id,
          details: `Created announcement: "${title}"`,
          createdAt: new Date(),
        },
      });

      return res.status(201).json({
        message: 'Announcement created successfully',
        announcement: {
          ...announcement,
          createdBy: announcement.users.name,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Announcements API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
