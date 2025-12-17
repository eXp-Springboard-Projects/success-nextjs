import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Get all notifications for the current user
      const notifications = await prisma.notifications.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: [
          { priority: 'desc' }, // URGENT first
          { createdAt: 'desc' },
        ],
        take: 100, // Limit to last 100 notifications
      });

      return res.status(200).json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  }

  if (req.method === 'POST') {
    try {
      // Create a new notification (admin only)
      if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const { userId, type, title, message, actionUrl, icon, priority, metadata, expiresAt } =
        req.body;

      const notification = await prisma.notifications.create({
        data: {
          userId,
          type,
          title,
          message,
          actionUrl,
          icon,
          priority: priority || 'NORMAL',
          metadata,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        },
      });

      return res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({ message: 'Failed to create notification' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
