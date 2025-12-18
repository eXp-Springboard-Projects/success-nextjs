import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

// Get recent sync logs and status
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get recent sync logs
    const syncLogs = await prisma.activity_logs.findMany({
      where: {
        action: 'WORDPRESS_SYNC',
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
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    // Parse details JSON
    const formattedLogs = syncLogs.map((log: any) => ({
      id: log.id,
      user: log.users,
      entity: log.entity,
      timestamp: log.createdAt,
      details: log.details ? JSON.parse(log.details) : null,
    }));

    // Get current database stats
    const stats = {
      posts: await prisma.posts.count(),
      categories: await prisma.categories.count(),
      tags: await prisma.tags.count(),
      users: await prisma.users.count({ where: { role: 'AUTHOR' } }),
    };

    return res.status(200).json({
      logs: formattedLogs,
      stats,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to fetch sync status',
      message: error.message,
    });
  }
}
