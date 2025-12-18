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

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  if (req.method === 'GET') {
    try {
      const project = await prisma.projects.findUnique({
        where: { id },
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

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      return res.status(200).json({ project });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch project' });
    } finally {
      await prisma.$disconnect();
    }
  }

  if (req.method === 'PATCH') {
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
        order,
      } = req.body;

      const updateData: any = { updatedAt: new Date() };

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;
      if (priority !== undefined) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (tags !== undefined) updateData.tags = tags;
      if (notes !== undefined) updateData.notes = notes;
      if (order !== undefined) updateData.order = order;

      const project = await prisma.projects.update({
        where: { id },
        data: updateData,
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

      return res.status(200).json({ project });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update project' });
    } finally {
      await prisma.$disconnect();
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.projects.delete({
        where: { id },
      });

      return res.status(200).json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete project' });
    } finally {
      await prisma.$disconnect();
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
