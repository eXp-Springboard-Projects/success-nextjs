import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';
import { randomUUID } from 'crypto';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  // GET - Fetch user's activity feed
  if (req.method === 'GET') {
    try {
      const { limit = '20', type } = req.query;

      const where: any = { userId };
      if (type && typeof type === 'string') {
        where.activityType = type;
      }

      const activities = await prisma.user_activities.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
      });

      return res.status(200).json(activities);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch activities' });
    }
  }

  // POST - Create a new activity
  if (req.method === 'POST') {
    try {
      const { activityType, title, description, metadata } = req.body;

      if (!activityType || !title) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const activity = await prisma.user_activities.create({
        data: {
          id: randomUUID(),
          userId,
          activityType,
          title,
          description: description || null,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      return res.status(201).json(activity);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create activity' });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
