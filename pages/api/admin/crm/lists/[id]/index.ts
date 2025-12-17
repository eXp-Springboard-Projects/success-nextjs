import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid list ID' });
  }

  if (req.method === 'GET') {
    try {
      const list = await prisma.contact_lists.findUnique({
        where: { id },
      });

      if (!list) {
        return res.status(404).json({ error: 'List not found' });
      }

      return res.status(200).json(list);
    } catch (error) {
      console.error('Error fetching list:', error);
      return res.status(500).json({ error: 'Failed to fetch list' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { name, description } = req.body;

      const list = await prisma.contact_lists.update({
        where: { id },
        data: {
          name,
          description,
          updatedAt: new Date(),
        },
      });

      return res.status(200).json(list);
    } catch (error) {
      console.error('Error updating list:', error);
      return res.status(500).json({ error: 'Failed to update list' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.contact_lists.delete({
        where: { id },
      });

      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting list:', error);
      return res.status(500).json({ error: 'Failed to delete list' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
