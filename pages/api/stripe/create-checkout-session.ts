import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { createCheckoutSession, getOrCreateStripeCustomer, STRIPE_PRICES } from '@/lib/stripe';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { plan, isUpgrade = false } = req.body;

    // Validate plan
    if (!plan || (plan !== 'monthly' && plan !== 'yearly')) {
      return res.status(400).json({ error: 'Invalid plan. Must be "monthly" or "yearly"' });
    }

    // Get user from database
    const user = await prisma.users.findUnique({
      where: { email: session.user.email! },
      include: {
        member: {
          select: {
            id: true,
            stripeCustomerId: true,
            trialEndsAt: true,
            subscriptions: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has an active subscription
    if (user.member?.subscriptions && user.member.subscriptions.length > 0) {
      return res.status(400).json({
        error: 'You already have an active subscription',
        hasSubscription: true,
      });
    }

    // Get or create Stripe customer
    const stripeCustomerId = user.member?.stripeCustomerId ||
      await getOrCreateStripeCustomer(user.email, user.name);

    // Update member with Stripe customer ID if not set
    if (user.member && !user.member.stripeCustomerId) {
      await prisma.members.update({
        where: { id: user.member.id },
        data: { stripeCustomerId },
      });
    }

    // Determine if user is converting from trial
    const isTrialConversion = user.trialEndsAt && new Date(user.trialEndsAt) > new Date();

    // Calculate remaining trial days for conversion
    let trialPeriodDays = 0;
    if (isTrialConversion && user.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(user.trialEndsAt);
      const diffTime = trialEnd.getTime() - now.getTime();
      trialPeriodDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Select price ID based on plan
    const priceId = plan === 'monthly'
      ? STRIPE_PRICES.SUCCESS_PLUS_MONTHLY
      : STRIPE_PRICES.SUCCESS_PLUS_YEARLY;

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      customerId: stripeCustomerId,
      priceId,
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success-plus/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success-plus?canceled=true`,
      trialPeriodDays: isTrialConversion ? trialPeriodDays : undefined,
    });

    // Log activity
    if (user.member) {
      await prisma.user_activities.create({
        data: {
          id: require('nanoid').nanoid(),
          userId: user.id,
          activityType: 'SUBSCRIPTION_STARTED',
          title: `Started ${plan} checkout`,
          description: `Initiated checkout for SUCCESS+ ${plan} subscription`,
          metadata: JSON.stringify({
            plan,
            priceId,
            isTrialConversion,
            trialPeriodDays,
          }),
        },
      }).catch(() => {
        // Ignore activity logging errors
      });
    }

    return res.status(200).json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    await prisma.$disconnect();
  }
}
