import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

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
    const { contactId } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    await prisma.$executeRaw`
      UPDATE sequence_enrollments
      SET status = 'unenrolled', updated_at = CURRENT_TIMESTAMP
      WHERE sequence_id = ${id} AND contact_id = ${contactId} AND status = 'active'
    `;

    return res.status(200).json({ message: 'Contact unenrolled successfully' });
  } catch (error) {
    console.error('Error unenrolling contact:', error);
    return res.status(500).json({ error: 'Failed to unenroll contact' });
  }
}
