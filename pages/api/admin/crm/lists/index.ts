import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const lists = await prisma.contact_lists.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json(lists);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch lists' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description, type, filters } = req.body;

      if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
      }

      const list = await prisma.contact_lists.create({
        data: {
          id: uuidv4(),
          name,
          description,
          type,
          filters: filters || null,
          memberCount: 0,
          updatedAt: new Date(),
        },
      });

      return res.status(201).json(list);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create list' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
