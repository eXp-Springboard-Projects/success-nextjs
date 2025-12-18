import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only SUPER_ADMIN can view pending staff
  if (session.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pendingUsers = await prisma.$queryRaw<Array<any>>`
      SELECT
        id,
        email,
        first_name as "firstName",
        last_name as "lastName",
        created_at as "createdAt"
      FROM users
      WHERE role = 'PENDING'
      ORDER BY created_at DESC
    `;

    return res.status(200).json(pendingUsers);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch pending users' });
  }
}
