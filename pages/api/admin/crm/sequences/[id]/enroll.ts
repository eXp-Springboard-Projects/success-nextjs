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
    return res.status(400).json({ error: 'Invalid sequence ID' });
  }

  try {
    const { contactId, dealId } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    // Check if already enrolled
    const existing = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM sequence_enrollments
      WHERE sequence_id = ${id} AND contact_id = ${contactId} AND status = 'active'
    `;

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Contact already enrolled in this sequence' });
    }

    const enrollmentId = nanoid();

    await prisma.$executeRaw`
      INSERT INTO sequence_enrollments (
        id, sequence_id, contact_id, deal_id, current_step, status
      ) VALUES (
        ${enrollmentId}, ${id}, ${contactId}, ${dealId || null}, 0, 'active'
      )
    `;

    // Update sequence total enrolled
    await prisma.$executeRaw`
      UPDATE sequences
      SET total_enrolled = total_enrolled + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    const enrollment = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM sequence_enrollments WHERE id = ${enrollmentId}
    `;

    return res.status(201).json(enrollment[0]);
  } catch (error) {
    console.error('Error enrolling contact:', error);
    return res.status(500).json({ error: 'Failed to enroll contact' });
  }
}
