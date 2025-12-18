import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, tagId } = req.query;

  if (!id || typeof id !== 'string' || !tagId || typeof tagId !== 'string') {
    return res.status(400).json({ error: 'Invalid contact ID or tag ID' });
  }

  try {
    await prisma.$executeRaw`
      DELETE FROM contact_tag_assignments
      WHERE contact_id = ${id} AND tag_id = ${tagId}
    `;

    await prisma.$executeRaw`
      INSERT INTO contact_activities (id, contact_id, type, description, metadata)
      VALUES (
        ${nanoid()}, ${id}, 'tag_removed', 'Tag removed from contact',
        ${JSON.stringify({ tagId })}::jsonb
      )
    `;

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove tag' });
  }
}
