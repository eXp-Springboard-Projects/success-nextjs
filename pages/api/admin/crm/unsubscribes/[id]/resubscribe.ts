import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  if (req.method === 'POST') {
    try {
      await prisma.email_preferences.update({
        where: { id },
        data: {
          unsubscribed: false,
          optInMarketing: true,
          optInNewsletter: true,
          optInTransactional: true,
          unsubscribedAt: null,
          unsubscribeReason: null,
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to resubscribe' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
