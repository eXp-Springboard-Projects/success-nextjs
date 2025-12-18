import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rules = await prisma.lead_scoring_rules.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ rules });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch scoring rules' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, eventType, points } = req.body;

      const rule = await prisma.lead_scoring_rules.create({
        data: {
          id: uuidv4(),
          name,
          eventType,
          points,
          updatedAt: new Date(),
        },
      });

      return res.status(201).json(rule);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create scoring rule' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
