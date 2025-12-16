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

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid deal ID' });
  }

  try {
    const { stageId } = req.body;

    if (!stageId) {
      return res.status(400).json({ error: 'Stage ID is required' });
    }

    // Get old stage name
    const oldDeal = await prisma.$queryRaw<Array<any>>`
      SELECT d.*, s.name as old_stage_name
      FROM deals d
      LEFT JOIN deal_stages s ON d.stage_id = s.id
      WHERE d.id = ${id}
    `;

    if (oldDeal.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Get new stage info
    const newStage = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM deal_stages WHERE id = ${stageId}
    `;

    if (newStage.length === 0) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    // Update deal
    await prisma.$executeRaw`
      UPDATE deals
      SET stage_id = ${stageId}, probability = ${newStage[0].probability}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    // Log activity
    await prisma.$executeRaw`
      INSERT INTO deal_activities (id, deal_id, type, description, metadata, created_by)
      VALUES (
        ${nanoid()}, ${id}, 'stage_changed',
        ${`Moved from ${oldDeal[0].old_stage_name} to ${newStage[0].name}`},
        ${JSON.stringify({ oldStage: oldDeal[0].old_stage_name, newStage: newStage[0].name })}::jsonb,
        ${session.user.id}
      )
    `;

    const deal = await prisma.$queryRaw<Array<any>>`
      SELECT d.*, s.name as stage_name, s.color as stage_color
      FROM deals d
      LEFT JOIN deal_stages s ON d.stage_id = s.id
      WHERE d.id = ${id}
    `;

    return res.status(200).json(deal[0]);
  } catch (error) {
    console.error('Error updating deal stage:', error);
    return res.status(500).json({ error: 'Failed to update deal stage' });
  }
}
