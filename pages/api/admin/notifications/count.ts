import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getSession({ req }) as any;

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Count unread notifications for the user
      const count = await prisma.notifications.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      }).catch(() => 0);

      return res.status(200).json({
        count,
        hasUnread: count > 0,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    return res.status(200).json({ count: 0, hasUnread: false });
  } finally {
    await prisma.$disconnect();
  }
}
