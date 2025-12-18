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
        member: {
          include: {
            subscriptions: {
              where: {
                OR: [
                  { status: 'ACTIVE' },
                  { status: 'TRIALING' },
                  { status: 'PAST_DUE' },
                ],
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!user || !user.member) {
      return res.status(404).json({ error: 'User or member not found' });
    }

    const subscription = user.member.subscriptions?.[0];

    if (!subscription) {
      return res.status(200).json({
        hasSubscription: false,
      });
    }

    return res.status(200).json({
      hasSubscription: true,
      status: subscription.status,
      tier: subscription.tier,
      billingCycle: subscription.billingCycle,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
