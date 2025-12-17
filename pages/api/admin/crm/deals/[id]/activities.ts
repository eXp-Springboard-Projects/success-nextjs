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
    return res.status(400).json({ error: 'Invalid deal ID' });
  }

  try {
    const { type, description, metadata = {} } = req.body;

    if (!type || !description) {
      return res.status(400).json({ error: 'Type and description are required' });
    }

    const activityId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO deal_activities (id, deal_id, type, description, metadata, created_by)
      VALUES (
        ${activityId}, ${id}, ${type}, ${description},
        ${JSON.stringify(metadata)}::jsonb, ${session.user.id}
      )
    `;

    const activity = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM deal_activities WHERE id = ${activityId}
    `;

    return res.status(201).json(activity[0]);
  } catch (error) {
    console.error('Error creating activity:', error);
    return res.status(500).json({ error: 'Failed to create activity' });
  }
}
