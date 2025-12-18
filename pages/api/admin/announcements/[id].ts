import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid announcement ID' });
    }

    if (req.method === 'GET') {
      const announcement = await prisma.announcements.findUnique({
        where: { id },
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

      if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      return res.status(200).json({
        ...announcement,
        createdBy: announcement.users.name,
      });
    }

    if (req.method === 'PUT') {
      // Only Super Admin and Admin can update announcements
      if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const {
        title,
        content,
        type,
        priority,
        targetAudience,
        isActive,
        isPinned,
        publishedAt,
        expiresAt,
        dismissible,
        linkUrl,
        linkText,
      } = req.body;

      const announcement = await prisma.announcements.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(content !== undefined && { content }),
          ...(type !== undefined && { type }),
          ...(priority !== undefined && { priority }),
          ...(targetAudience !== undefined && { targetAudience }),
          ...(isActive !== undefined && { isActive }),
          ...(isPinned !== undefined && { isPinned }),
          ...(publishedAt !== undefined && { publishedAt: new Date(publishedAt) }),
          ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
          ...(dismissible !== undefined && { dismissible }),
          ...(linkUrl !== undefined && { linkUrl }),
          ...(linkText !== undefined && { linkText }),
          updatedAt: new Date(),
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
          action: 'ANNOUNCEMENT_UPDATED',
          entity: 'announcements',
          entityId: announcement.id,
          details: `Updated announcement: "${announcement.title}"`,
          createdAt: new Date(),
        },
      });

      return res.status(200).json({
        message: 'Announcement updated successfully',
        announcement: {
          ...announcement,
          createdBy: announcement.users.name,
        },
      });
    }

    if (req.method === 'DELETE') {
      // Only Super Admin and Admin can delete announcements
      if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const announcement = await prisma.announcements.findUnique({
        where: { id },
        select: { title: true },
      });

      if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      await prisma.announcements.delete({
        where: { id },
      });

      // Log activity
      await prisma.activity_logs.create({
        data: {
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          action: 'ANNOUNCEMENT_DELETED',
          entity: 'announcements',
          entityId: id,
          details: `Deleted announcement: "${announcement.title}"`,
          createdAt: new Date(),
        },
      });

      return res.status(200).json({
        message: 'Announcement deleted successfully',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Announcement detail API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
