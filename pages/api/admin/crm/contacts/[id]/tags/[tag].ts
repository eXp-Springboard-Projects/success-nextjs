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

  try {
    const { id, tag } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    if (!tag || typeof tag !== 'string') {
      return res.status(400).json({ error: 'Invalid tag' });
    }

    await prisma.$executeRaw`
      DELETE FROM crm_contact_tags
      WHERE contact_id = ${id} AND tag = ${tag}
    `;

    // Add activity
    await prisma.$executeRaw`
      INSERT INTO crm_contact_activities (id, contact_id, type, description, metadata)
      VALUES (
        ${nanoid()}, ${id}, 'tag_removed',
        'Tag removed: ${tag}',
        ${JSON.stringify({ tag })}::jsonb
      )
    `;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error removing tag:', error);
    return res.status(500).json({ error: 'Failed to remove tag' });
  }
}
