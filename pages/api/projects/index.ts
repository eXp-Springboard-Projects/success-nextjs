import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: any = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { status, assignedToId, priority, search } = req.query;

      const where: any = {};

      if (status && status !== 'ALL') {
        where.status = status;
      }

      if (assignedToId && assignedToId !== 'ALL') {
        where.assignedToId = assignedToId;
      }

      if (priority && priority !== 'ALL') {
        where.priority = priority;
      }

      if (search && typeof search === 'string') {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const projects = await prisma.projects.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' },
          { order: 'asc' },
          { createdAt: 'desc' },
        ],
      });

      return res.status(200).json({ projects });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch projects' });
    } finally {
      await prisma.$disconnect();
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        title,
        description,
        status,
        assignedToId,
        priority,
        dueDate,
        tags,
        notes,
      } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const project = await prisma.projects.create({
        data: {
          title,
          description: description || null,
          status: status || 'BACKLOG',
          assignedToId: assignedToId || null,
          priority: priority || 'MEDIUM',
          dueDate: dueDate ? new Date(dueDate) : null,
          createdBy: session.user.id,
          tags: tags || [],
          notes: notes || null,
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return res.status(201).json({ project });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create project' });
    } finally {
      await prisma.$disconnect();
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
