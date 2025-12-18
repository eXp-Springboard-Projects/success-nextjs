import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

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
    return res.status(400).json({ error: 'Invalid sequence ID' });
  }

  try {
    const sequence = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM sequences WHERE id = ${id}
    `;

    if (sequence.length === 0) {
      return res.status(404).json({ error: 'Sequence not found' });
    }

    const seq = sequence[0];
    const newId = nanoid();
    const newName = `${seq.name} (Copy)`;

    await prisma.$executeRaw`
      INSERT INTO sequences (
        id, name, description, steps, status, auto_unenroll_on_reply, created_by
      ) VALUES (
        ${newId}, ${newName}, ${seq.description}, ${seq.steps}::jsonb,
        'draft', ${seq.auto_unenroll_on_reply}, ${session.user.id}
      )
    `;

    const newSequence = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM sequences WHERE id = ${newId}
    `;

    return res.status(201).json(newSequence[0]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to duplicate sequence' });
  }
}
