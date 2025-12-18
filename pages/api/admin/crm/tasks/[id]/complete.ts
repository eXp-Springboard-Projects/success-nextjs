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
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  try {
    await prisma.$executeRaw`
      UPDATE tasks
      SET status = 'completed',
          completed_at = CURRENT_TIMESTAMP,
          completed_by = ${session.user.id},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    const task = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM tasks WHERE id = ${id}
    `;

    return res.status(200).json(task[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to complete task' });
  }
}
