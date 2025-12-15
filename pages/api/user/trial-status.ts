import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email! },
      include: {
        members_users_linkedMemberIdTomembers: {
          select: {
            membershipTier: true,
            membershipStatus: true,
            trialEndsAt: true,
            trialStartedAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const member = user.members_users_linkedMemberIdTomembers;
    const trialEndsAt = user.trialEndsAt || member?.trialEndsAt;
    const membershipTier = member?.membershipTier || 'FREE';

    // Calculate if trial is active
    const isTrialActive =
      membershipTier === 'TRIALING' &&
      trialEndsAt &&
      new Date(trialEndsAt) > new Date();

    // Calculate days remaining
    let daysRemaining = 0;
    if (isTrialActive && trialEndsAt) {
      const now = new Date();
      const endDate = new Date(trialEndsAt);
      const diffTime = endDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return res.status(200).json({
      isTrialActive,
      trialEndsAt,
      daysRemaining,
      membershipTier,
      membershipStatus: member?.membershipStatus || 'Inactive',
    });
  } catch (error) {
    console.error('Trial status API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
