import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient, EditorialStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { status } = req.query;

      const where = status && status !== 'all' ? { status: status as EditorialStatus } : {};

      const items = await prisma.editorial_calendar.findMany({
        where,
        include: {
          users: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledDate: 'asc' },
          { createdAt: 'desc' },
        ],
      });

      return res.status(200).json(items);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch editorial items' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        title,
        contentType,
        status,
        priority,
        scheduledDate,
        deadline,
        notes,
        assignedToId,
      } = req.body;

      const item = await prisma.editorial_calendar.create({
        data: {
          id: randomUUID(),
          title,
          contentType: contentType || 'ARTICLE',
          status: status || 'IDEA',
          priority: priority || 'MEDIUM',
          scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
          deadline: deadline ? new Date(deadline) : undefined,
          notes,
          assignedToId,
          updatedAt: new Date(),
        },
        include: {
          users: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return res.status(201).json(item);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create editorial item' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
