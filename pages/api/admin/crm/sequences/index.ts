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
    return getSequences(req, res);
  } else if (req.method === 'POST') {
    return createSequence(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getSequences(req: NextApiRequest, res: NextApiResponse) {
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

    const sequences = await prisma.$queryRawUnsafe(`
      SELECT
        s.*,
        CASE
          WHEN s.total_enrolled > 0 THEN (s.total_replied::float / s.total_enrolled * 100)
          ELSE 0
        END as reply_rate
      FROM sequences s
      WHERE 1=1 ${whereClause}
      ORDER BY s.created_at DESC
    `, ...params);

    return res.status(200).json({ sequences });
  } catch (error) {
    console.error('Error fetching sequences:', error);
    return res.status(500).json({ error: 'Failed to fetch sequences' });
  }
}

async function createSequence(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const {
      name,
      description,
      steps = [],
      autoUnenrollOnReply = true,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const sequenceId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO sequences (
        id, name, description, steps, status, auto_unenroll_on_reply, created_by
      ) VALUES (
        ${sequenceId}, ${name}, ${description || null}, ${JSON.stringify(steps)}::jsonb,
        'draft', ${autoUnenrollOnReply}, ${session.user.id}
      )
    `;

    const sequence = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM sequences WHERE id = ${sequenceId}
    `;

    return res.status(201).json(sequence[0]);
  } catch (error) {
    console.error('Error creating sequence:', error);
    return res.status(500).json({ error: 'Failed to create sequence' });
  }
}
