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
    return res.status(400).json({ error: 'Invalid automation ID' });
  }

  if (req.method === 'GET') {
    return getAutomation(id, res);
  } else if (req.method === 'PATCH') {
    return updateAutomation(id, req, res);
  } else if (req.method === 'DELETE') {
    return deleteAutomation(id, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getAutomation(id: string, res: NextApiResponse) {
  try {
    const automation = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM automations WHERE id = ${id}
    `;

    if (automation.length === 0) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    return res.status(200).json(automation[0]);
  } catch (error) {
    console.error('Error fetching automation:', error);
    return res.status(500).json({ error: 'Failed to fetch automation' });
  }
}

async function updateAutomation(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, description, trigger, steps, status } = req.body;

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

    if (trigger !== undefined) {
      updates.push(`trigger = $${paramIndex}::jsonb`);
      params.push(JSON.stringify(trigger));
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

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    params.push(id);

    await prisma.$queryRawUnsafe(`
      UPDATE automations
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, ...params);

    const automation = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM automations WHERE id = ${id}
    `;

    return res.status(200).json(automation[0]);
  } catch (error) {
    console.error('Error updating automation:', error);
    return res.status(500).json({ error: 'Failed to update automation' });
  }
}

async function deleteAutomation(id: string, res: NextApiResponse) {
  try {
    await prisma.$executeRaw`DELETE FROM automations WHERE id = ${id}`;
    return res.status(200).json({ message: 'Automation deleted successfully' });
  } catch (error) {
    console.error('Error deleting automation:', error);
    return res.status(500).json({ error: 'Failed to delete automation' });
  }
}
