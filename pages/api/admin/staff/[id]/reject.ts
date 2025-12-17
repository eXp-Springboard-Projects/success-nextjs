import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only SUPER_ADMIN can reject staff
  if (session.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    // Check if user exists and is pending
    const user = await prisma.$queryRaw<Array<{ role: string; email: string }>>`
      SELECT role, email FROM users WHERE id = ${id}
    `;

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user[0].role !== 'PENDING') {
      return res.status(400).json({ error: 'User is not pending approval' });
    }

    // Delete the pending user
    await prisma.$executeRaw`
      DELETE FROM users WHERE id = ${id}
    `;

    // TODO: Send rejection email to user

    return res.status(200).json({ message: 'User request rejected' });
  } catch (error) {
    console.error('Error rejecting user:', error);
    return res.status(500).json({ error: 'Failed to reject user' });
  }
}
