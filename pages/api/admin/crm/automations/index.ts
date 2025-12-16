import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return getAutomations(req, res);
  } else if (req.method === 'POST') {
    return createAutomation(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getAutomations(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { status = '' } = req.query;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const automations = await prisma.$queryRawUnsafe(`
      SELECT *
      FROM automations
      WHERE 1=1 ${whereClause}
      ORDER BY created_at DESC
    `, ...params);

    return res.status(200).json({ automations });
  } catch (error) {
    console.error('Error fetching automations:', error);
    return res.status(500).json({ error: 'Failed to fetch automations' });
  }
}

async function createAutomation(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const {
      name,
      description,
      trigger,
      steps = [],
    } = req.body;

    if (!name || !trigger) {
      return res.status(400).json({ error: 'Name and trigger are required' });
    }

    const automationId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO automations (
        id, name, description, trigger, steps, status, created_by
      ) VALUES (
        ${automationId}, ${name}, ${description || null}, ${JSON.stringify(trigger)}::jsonb,
        ${JSON.stringify(steps)}::jsonb, 'draft', ${session.user.id}
      )
    `;

    const automation = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM automations WHERE id = ${automationId}
    `;

    return res.status(201).json(automation[0]);
  } catch (error) {
    console.error('Error creating automation:', error);
    return res.status(500).json({ error: 'Failed to create automation' });
  }
}
