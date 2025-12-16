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

  try {
    const { id } = req.query;
    const { tag } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    if (!tag) {
      return res.status(400).json({ error: 'Tag is required' });
    }

    const tagId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO crm_contact_tags (id, contact_id, tag)
      VALUES (${tagId}, ${id}, ${tag})
      ON CONFLICT (contact_id, tag) DO NOTHING
    `;

    // Add activity
    await prisma.$executeRaw`
      INSERT INTO crm_contact_activities (id, contact_id, type, description, metadata)
      VALUES (
        ${nanoid()}, ${id}, 'tag_added',
        'Tag added: ${tag}',
        ${JSON.stringify({ tag })}::jsonb
      )
    `;

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error adding tag:', error);
    return res.status(500).json({ error: 'Failed to add tag' });
  }
}
