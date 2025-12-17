import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, contactId } = req.query;

  if (typeof id !== 'string' || typeof contactId !== 'string') {
    return res.status(400).json({ error: 'Invalid list ID or contact ID' });
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.list_members.deleteMany({
        where: {
          listId: id,
          contactId: contactId,
        },
      });

      // Update member count
      await prisma.contact_lists.update({
        where: { id },
        data: {
          memberCount: {
            decrement: 1,
          },
          updatedAt: new Date(),
        },
      });

      return res.status(204).end();
    } catch (error) {
      console.error('Error removing member:', error);
      return res.status(500).json({ error: 'Failed to remove member' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
