import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { stripe } from '@/lib/stripe';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find user with this claim token
    const user = await prisma.users.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Check if already claimed
    if (user.password && user.password !== '') {
      return res.status(400).json({ error: 'This account has already been claimed' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    let stripeCustomerId: string | null = null;
    let membershipTier: 'Free' | 'SUCCESSPlus' = 'Free';

    // Get Stripe customer and subscription info (only if Stripe is configured)
    if (stripe) {
      const stripeCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (stripeCustomers.data.length > 0) {
        const stripeCustomer = stripeCustomers.data[0];
        stripeCustomerId = stripeCustomer.id;

        // Check for active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomer.id,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          membershipTier = 'SUCCESSPlus';
        }
      }
    }

    // Create or get member record
    let member = await prisma.members.findFirst({
      where: { email: user.email },
    });

    if (!member) {
      // Create new member
      const [firstName, ...lastNameParts] = user.name.split(' ');
      const lastName = lastNameParts.join(' ') || firstName;

      member = await prisma.members.create({
        data: {
          id: nanoid(),
          firstName,
          lastName,
          email: user.email,
          phone: null,
          membershipTier,
          membershipStatus: 'Active',
          stripeCustomerId,
          totalSpent: 0,
          lifetimeValue: 0,
          engagementScore: 0,
          tags: ['claimed-account'],
          priorityLevel: 'Standard',
        },
      });
    }

    // Update user with password and link to member
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null, // Clear claim token
        resetTokenExpiry: null,
        emailVerified: true,
        memberId: member.id,
        hasChangedDefaultPassword: true,
      },
    });

    // If there's an active Stripe subscription, create subscription record
    if (stripe && stripeCustomerId && membershipTier === 'SUCCESSPlus') {
      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (stripeSubscriptions.data.length > 0) {
        const stripeSub = stripeSubscriptions.data[0];

        // Check if subscription already exists
        const existingSub = await prisma.subscriptions.findUnique({
          where: { stripeSubscriptionId: stripeSub.id },
        });

        if (!existingSub) {
          // Extract subscription data with proper type handling
          const subData: any = stripeSub;
          const currentPeriodStart = subData.current_period_start || subData.currentPeriodStart;
          const currentPeriodEnd = subData.current_period_end || subData.currentPeriodEnd;
          const cancelAtPeriodEnd = subData.cancel_at_period_end ?? subData.cancelAtPeriodEnd ?? false;

          await prisma.subscriptions.create({
            data: {
              id: nanoid(),
              memberId: member.id,
              stripeCustomerId,
              stripeSubscriptionId: stripeSub.id,
              stripePriceId: stripeSub.items.data[0]?.price.id,
              provider: 'stripe',
              status: stripeSub.status.toUpperCase(),
              tier: 'SUCCESS_PLUS',
              currentPeriodStart: new Date(currentPeriodStart * 1000),
              currentPeriodEnd: new Date(currentPeriodEnd * 1000),
              cancelAtPeriodEnd,
              billingCycle: stripeSub.items.data[0]?.price.recurring?.interval?.toUpperCase() || 'MONTHLY',
              updatedAt: new Date(),
            },
          });
        }
      }
    }

    // Log activity
    await prisma.user_activities.create({
      data: {
        id: nanoid(),
        userId: user.id,
        activityType: 'SUBSCRIPTION_STARTED',
        title: 'Account Claimed',
        description: 'User claimed their SUCCESS+ account',
        metadata: JSON.stringify({
          membershipTier,
          hasStripeCustomer: !!stripeCustomerId,
        }),
      },
    }).catch(() => {
      // Ignore activity logging errors
    });

    return res.status(200).json({
      success: true,
      email: user.email,
      message: 'Account claimed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to complete account claim. Please try again or contact support.',
    });
  } finally {
    await prisma.$disconnect();
  }
}
