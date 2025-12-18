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
      const now = new Date();

      // Get active announcements that haven't been dismissed by the user
      const announcements = await prisma.announcements.findMany({
        where: {
          isActive: true,
          publishedAt: {
            lte: now,
          },
          AND: [
            {
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: now } },
              ],
            },
            {
              // Filter by target audience
              OR: [
                { targetAudience: 'ALL' },
                ...(session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN' || session.user.role === 'EDITOR' || session.user.role === 'AUTHOR'
                  ? [{ targetAudience: 'STAFF' }]
                  : []),
                ...((session.user as any).memberId ? [{ targetAudience: 'MEMBERS' }] : []),
              ],
            },
          ],
        },
        orderBy: [
          { isPinned: 'desc' },
          { priority: 'desc' },
          { publishedAt: 'desc' },
        ],
        include: {
          announcement_views: {
            where: {
              userId: session.user.id,
            },
            select: {
              viewedAt: true,
              dismissedAt: true,
            },
          },
        },
      });

      // Filter out dismissed announcements (if they're dismissible)
      const activeAnnouncements = announcements.filter(a => {
        if (!a.dismissible) return true; // Non-dismissible always show
        const view = a.announcement_views[0];
        return !view || !view.dismissedAt; // Show if not dismissed
      });

      return res.status(200).json({
        announcements: activeAnnouncements.map(a => ({
          id: a.id,
          title: a.title,
          content: a.content,
          type: a.type,
          priority: a.priority,
          dismissible: a.dismissible,
          isPinned: a.isPinned,
          linkUrl: a.linkUrl,
          linkText: a.linkText,
          publishedAt: a.publishedAt,
          expiresAt: a.expiresAt,
        })),
      });
    }

    if (req.method === 'POST') {
      // Mark announcement as viewed or dismissed
      const { announcementId, action } = req.body;

      if (!announcementId || !action) {
        return res.status(400).json({ error: 'announcementId and action are required' });
      }

      if (action !== 'view' && action !== 'dismiss') {
        return res.status(400).json({ error: 'action must be either "view" or "dismiss"' });
      }

      // Upsert the announcement view record
      const view = await prisma.announcement_views.upsert({
        where: {
          announcementId_userId: {
            announcementId,
            userId: session.user.id,
          },
        },
        create: {
          announcementId,
          userId: session.user.id,
          viewedAt: new Date(),
          ...(action === 'dismiss' && { dismissedAt: new Date() }),
        },
        update: {
          ...(action === 'dismiss' && { dismissedAt: new Date() }),
        },
      });

      return res.status(200).json({
        message: `Announcement ${action}ed successfully`,
        view,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Active announcements API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
