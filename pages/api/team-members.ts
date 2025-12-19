import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma.js';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const teamMembers = await prisma.team_members.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        title: true,
        bio: true,
        image: true,
        linkedIn: true,
        displayOrder: true,
      },
    });

    return res.status(200).json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return res.status(500).json({ error: 'Failed to fetch team members' });
  }
}
