import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      include: {
        member: {
          include: {
            subscriptions: true,
          },
        },
        bookmarks: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      subscription: user.member?.subscriptions?.[0] || null,
      bookmarksCount: user.bookmarks.length,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch account data' });
  }
}
