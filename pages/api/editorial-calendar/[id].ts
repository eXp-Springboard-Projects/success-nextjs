import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  if (req.method === 'GET') {
    try {
      const item = await prisma.editorial_calendar.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      return res.status(200).json(item);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch editorial item' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const {
        title,
        contentType,
        status,
        priority,
        scheduledDate,
        publishDate,
        deadline,
        notes,
        assignedToId,
        wordpressId,
      } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (contentType !== undefined) updateData.contentType = contentType;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
      if (publishDate !== undefined) updateData.publishDate = publishDate ? new Date(publishDate) : null;
      if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
      if (notes !== undefined) updateData.notes = notes;
      if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
      if (wordpressId !== undefined) updateData.wordpressId = wordpressId;

      const item = await prisma.editorial_calendar.update({
        where: { id },
        data: updateData,
        include: {
          users: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return res.status(200).json(item);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update editorial item' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.editorial_calendar.delete({
        where: { id },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete editorial item' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
