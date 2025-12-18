import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid comment ID' });
  }

  if (req.method === 'PATCH') {
    try {
      const { action } = req.body;

      let updateData: any = {};

      switch (action) {
        case 'APPROVE':
          updateData = { status: 'APPROVED' };
          break;
        case 'SPAM':
          updateData = { status: 'SPAM' };
          break;
        case 'TRASH':
          updateData = { status: 'TRASH' };
          break;
        case 'DELETE':
          await prisma.comments.delete({ where: { id } });
          return res.status(200).json({ success: true, message: 'Comment deleted' });
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }

      const comment = await prisma.comments.update({
        where: { id },
        data: updateData,
      });

      // Log activity
      await prisma.activity_logs.create({
        data: {
          id: randomUUID(),
          userId: session.user.id,
          action: action.toUpperCase(),
          entity: 'comment',
          entityId: id,
          details: JSON.stringify({ commentId: id, newStatus: updateData.status }),
        },
      });

      return res.status(200).json(comment);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update comment' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.comments.delete({
        where: { id },
      });

      // Log activity
      await prisma.activity_logs.create({
        data: {
          id: randomUUID(),
          userId: session.user.id,
          action: 'DELETE',
          entity: 'comment',
          entityId: id,
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete comment' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
