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
  const { note } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid contact ID' });
  }

  if (!note) {
    return res.status(400).json({ error: 'Note is required' });
  }

  try {
    const noteId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO contact_notes (id, contact_id, staff_id, staff_name, note)
      VALUES (
        ${noteId}, ${id}, ${session.user.id},
        ${session.user.name || session.user.email}, ${note}
      )
    `;

    await prisma.$executeRaw`
      INSERT INTO contact_activities (id, contact_id, type, description)
      VALUES (${nanoid()}, ${id}, 'note_added', 'Staff note added')
    `;

    const createdNote = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM contact_notes WHERE id = ${noteId}
    `;

    return res.status(201).json(createdNote[0]);
  } catch (error) {
    console.error('Error adding note:', error);
    return res.status(500).json({ error: 'Failed to add note' });
  }
}
