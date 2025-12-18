import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const campaigns = await prisma.campaigns.findMany({
        include: {
          _count: {
            select: {
              campaign_contacts: true,
              drip_emails: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(campaigns);
    }

    if (req.method === 'POST') {
      const { name, subject, scheduledAt } = req.body;

      if (!name || !subject) {
        return res.status(400).json({ message: 'Name and subject are required' });
      }

      const campaign = await prisma.campaigns.create({
        data: {
          id: randomUUID(),
          name,
          subject,
          status: 'DRAFT',
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          updatedAt: new Date(),
        },
      });

      return res.status(201).json(campaign);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
