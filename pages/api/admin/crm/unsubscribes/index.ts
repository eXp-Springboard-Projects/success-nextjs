import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const unsubscribes = await prisma.email_preferences.findMany({
        where: {
          unsubscribed: true,
        },
        include: {
          contact: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { unsubscribedAt: 'desc' },
      });

      const formatted = unsubscribes.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.contact?.firstName || null,
        lastName: u.contact?.lastName || null,
        unsubscribedAt: u.unsubscribedAt,
        unsubscribeReason: u.unsubscribeReason,
        optInMarketing: u.optInMarketing,
        optInNewsletter: u.optInNewsletter,
        optInTransactional: u.optInTransactional,
      }));

      return res.status(200).json(formatted);
    } catch (error) {
      console.error('Error fetching unsubscribes:', error);
      return res.status(500).json({ error: 'Failed to fetch unsubscribes' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
