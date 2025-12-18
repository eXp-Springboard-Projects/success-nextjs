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

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid automation ID' });
  }

  try {
    const automation = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM automations WHERE id = ${id}
    `;

    if (automation.length === 0) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    const auto = automation[0];

    if (auto.status === 'paused') {
      return res.status(400).json({ error: 'Automation is already paused' });
    }

    await prisma.$executeRaw`
      UPDATE automations
      SET status = 'paused', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    const updated = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM automations WHERE id = ${id}
    `;

    return res.status(200).json(updated[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to pause automation' });
  }
}
