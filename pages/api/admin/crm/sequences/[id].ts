import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid sequence ID' });
  }

  if (req.method === 'GET') {
    return getSequence(id, res);
  } else if (req.method === 'PATCH') {
    return updateSequence(id, req, res);
  } else if (req.method === 'DELETE') {
    return deleteSequence(id, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getSequence(id: string, res: NextApiResponse) {
  try {
    const sequence = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM sequences WHERE id = ${id}
    `;

    if (sequence.length === 0) {
      return res.status(404).json({ error: 'Sequence not found' });
    }

    return res.status(200).json(sequence[0]);
  } catch (error) {
    console.error('Error fetching sequence:', error);
    return res.status(500).json({ error: 'Failed to fetch sequence' });
  }
}

async function updateSequence(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, description, steps, status, autoUnenrollOnReply } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }

    if (steps !== undefined) {
      updates.push(`steps = $${paramIndex}::jsonb`);
      params.push(JSON.stringify(steps));
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (autoUnenrollOnReply !== undefined) {
      updates.push(`auto_unenroll_on_reply = $${paramIndex}`);
      params.push(autoUnenrollOnReply);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    params.push(id);

    await prisma.$queryRawUnsafe(`
      UPDATE sequences
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, ...params);

    const sequence = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM sequences WHERE id = ${id}
    `;

    return res.status(200).json(sequence[0]);
  } catch (error) {
    console.error('Error updating sequence:', error);
    return res.status(500).json({ error: 'Failed to update sequence' });
  }
}

async function deleteSequence(id: string, res: NextApiResponse) {
  try {
    await prisma.$executeRaw`DELETE FROM sequences WHERE id = ${id}`;
    return res.status(200).json({ message: 'Sequence deleted successfully' });
  } catch (error) {
    console.error('Error deleting sequence:', error);
    return res.status(500).json({ error: 'Failed to delete sequence' });
  }
}
