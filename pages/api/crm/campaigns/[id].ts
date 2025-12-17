import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid campaign ID' });
  }

  try {
    if (req.method === 'GET') {
      const campaign = await prisma.campaigns.findUnique({
        where: { id },
        include: {
          drip_emails: {
            orderBy: { order: 'asc' },
          },
          campaign_contacts: {
            include: {
              contacts: true,
            },
          },
          email_templates: true,
        },
      });

      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      return res.status(200).json(campaign);
    }

    if (req.method === 'PUT') {
      const { name, subject, status, scheduledAt } = req.body;

      const campaign = await prisma.campaigns.update({
        where: { id },
        data: {
          name: name || undefined,
          subject: subject || undefined,
          status: status || undefined,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
          updatedAt: new Date(),
        },
      });

      return res.status(200).json(campaign);
    }

    if (req.method === 'DELETE') {
      await prisma.campaigns.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Campaign deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in campaign API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
