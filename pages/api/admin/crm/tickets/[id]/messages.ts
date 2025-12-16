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
    const { message, isInternal = false } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const messageId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO ticket_messages (
        id, ticket_id, sender_id, sender_type, message, is_internal
      ) VALUES (
        ${messageId}, ${id}, ${session.user.id}, 'staff', ${message}, ${isInternal}
      )
    `;

    // Update ticket updated_at
    await prisma.$executeRaw`
      UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ${id}
    `;

    const createdMessage = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM ticket_messages WHERE id = ${messageId}
    `;

    return res.status(201).json(createdMessage[0]);
  } catch (error) {
    console.error('Error adding message:', error);
    return res.status(500).json({ error: 'Failed to add message' });
  }
}
