import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only ADMIN and SUPER_ADMIN can view invite codes
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only admins can view invite codes' });
    }

    const invites = await prisma.invite_codes.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.status(200).json({
      success: true,
      invites,
    });

  } catch (error) {
    console.error('List invites error:', error);
    return res.status(500).json({ error: 'Failed to fetch invite codes' });
  }
}
