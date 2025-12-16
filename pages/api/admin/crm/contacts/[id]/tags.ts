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
  const { tagId } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid contact ID' });
  }

  if (!tagId) {
    return res.status(400).json({ error: 'Tag ID is required' });
  }

  try {
    await prisma.$executeRaw`
      INSERT INTO contact_tag_assignments (contact_id, tag_id)
      VALUES (${id}, ${tagId})
      ON CONFLICT DO NOTHING
    `;

    await prisma.$executeRaw`
      INSERT INTO contact_activities (id, contact_id, type, description, metadata)
      VALUES (
        ${nanoid()}, ${id}, 'tag_added', 'Tag added to contact',
        ${JSON.stringify({ tagId })}::jsonb
      )
    `;

    const tag = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM contact_tags WHERE id = ${tagId}
    `;

    return res.status(201).json(tag[0]);
  } catch (error) {
    console.error('Error adding tag:', error);
    return res.status(500).json({ error: 'Failed to add tag' });
  }
}
