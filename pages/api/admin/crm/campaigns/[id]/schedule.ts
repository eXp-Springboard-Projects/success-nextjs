import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { scheduledAt } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid campaign ID' });
  }

  if (!scheduledAt) {
    return res.status(400).json({ error: 'Scheduled date/time is required' });
  }

  try {
    await prisma.$executeRaw`
      UPDATE email_campaigns
      SET status = 'scheduled',
          scheduled_at = ${new Date(scheduledAt)},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    const campaign = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM email_campaigns WHERE id = ${id}
    `;

    return res.status(200).json(campaign[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to schedule campaign' });
  }
}
