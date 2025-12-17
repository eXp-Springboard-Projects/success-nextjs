import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Check if user has admin role
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }

  if (req.method === 'GET') {
    try {
      // Fetch all members with subscriptions and platform user info
      // FILTER: Only show members who have actually made purchases or subscriptions
      const members = await prisma.members.findMany({
        where: {
          OR: [
            { totalSpent: { gt: 0 } },
            { membershipTier: { not: 'Free' } },
            {
              subscriptions: {
                some: {},
              },
            },
          ],
        },
        include: {
          subscriptions: {
            select: {
              status: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,
              stripePriceId: true,
              provider: true,
              tier: true,
            },
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
          },
          platformUser: {
            select: {
              id: true,
              role: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transform data for frontend
      type Member = typeof members[number];
      const transformedMembers = members.map((member: Member) => ({
        id: member.id,
        name: `${member.firstName} ${member.lastName}`.trim(),
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        membershipTier: member.membershipTier,
        membershipStatus: member.membershipStatus,
        totalSpent: member.totalSpent.toNumber(),
        lifetimeValue: member.lifetimeValue.toNumber(),
        createdAt: member.createdAt,
        joinDate: member.joinDate,
        subscription: member.subscriptions?.[0] || null,
        platformRole: member.platformUser?.role || null,
        isPlatformUser: !!member.platformUser,
      }));

      return res.status(200).json(transformedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      return res.status(500).json({ message: 'Failed to fetch members' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
