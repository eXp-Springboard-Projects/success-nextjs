import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'PATCH') {
    try {
      const { name, eventType, points, isActive } = req.body;

      const rule = await prisma.lead_scoring_rules.update({
        where: { id: id as string },
        data: {
          ...(name !== undefined && { name }),
          ...(eventType !== undefined && { eventType }),
          ...(points !== undefined && { points }),
          ...(isActive !== undefined && { isActive }),
          updatedAt: new Date(),
        },
      });

      return res.status(200).json(rule);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update scoring rule' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.lead_scoring_rules.delete({
        where: { id: id as string },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete scoring rule' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
