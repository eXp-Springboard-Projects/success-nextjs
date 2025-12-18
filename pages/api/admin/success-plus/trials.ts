import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { hasDepartmentAccess } from '@/lib/departmentAuth';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req }) as any;

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check department access
    if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, 'SUCCESS_PLUS')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const now = new Date();

    // Get all trial users from members table
    const trialMembers = await prisma.members.findMany({
      where: {
        trialEndsAt: {
          not: null,
        },
      },
      include: {
        subscriptions: {
          where: {
            tier: 'SUCCESS_PLUS_TRIAL',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        trialEndsAt: 'asc',
      },
    });

    // Calculate stats
    const allTrials = trialMembers.length;

    const activeTrials = trialMembers.filter(
      (member) => member.trialEndsAt && new Date(member.trialEndsAt) > now
    );

    const expiredTrials = trialMembers.filter(
      (member) => member.trialEndsAt && new Date(member.trialEndsAt) <= now
    );

    // Converted trials = expired trials that upgraded to paid SUCCESS+ membership
    const convertedTrials = expiredTrials.filter(
      (member) => member.membershipTier === 'SUCCESSPlus' && member.membershipStatus === 'Active'
    );

    // Calculate conversion rate
    const totalExpired = expiredTrials.length;
    const conversionRate = totalExpired > 0
      ? (convertedTrials.length / totalExpired) * 100
      : 0;

    // Format trial users for table
    const trialUsers = trialMembers.map((member) => {
      const trialEndDate = member.trialEndsAt ? new Date(member.trialEndsAt) : null;
      const isExpired = trialEndDate ? trialEndDate <= now : true;
      const isConverted = member.membershipTier === 'SUCCESSPlus' && member.membershipStatus === 'Active';

      // Calculate days remaining
      let daysRemaining = 0;
      if (trialEndDate && !isExpired) {
        const diffTime = trialEndDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        trialStartedAt: member.trialStartedAt,
        trialEndsAt: member.trialEndsAt,
        daysRemaining: isExpired ? 0 : daysRemaining,
        status: isConverted ? 'Converted' : isExpired ? 'Expired' : 'Active',
        membershipTier: member.membershipTier,
        membershipStatus: member.membershipStatus,
      };
    });

    const stats = {
      totalTrials: allTrials,
      activeTrials: activeTrials.length,
      expiredTrials: expiredTrials.length - convertedTrials.length, // Subtract converted from expired
      convertedTrials: convertedTrials.length,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      trialUsers,
    };

    return res.status(200).json(stats);

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
