import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get user with member and subscription data
    const user = await prisma.users.findUnique({
      where: { email: session.user.email! },
      include: {
        member: {
          include: {
            subscriptions: {
              where: {
                status: 'ACTIVE',
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

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const activeSubscription = user.member?.subscriptions?.[0];

    if (!activeSubscription) {
      return res.status(200).json({
        status: 'inactive',
        membershipTier: user.member?.membershipTier || 'Free',
      });
    }

    // Get payment method info from Stripe if available
    let paymentMethod = null;
    if (activeSubscription.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const customer = await stripe.customers.retrieve(activeSubscription.stripeCustomerId);

        if (customer && !customer.deleted && customer.invoice_settings?.default_payment_method) {
          const pm = await stripe.paymentMethods.retrieve(
            customer.invoice_settings.default_payment_method
          );

          if (pm.card) {
            paymentMethod = {
              last4: pm.card.last4,
              brand: pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1),
            };
          }
        }
      } catch (stripeError) {
        // Continue without payment method info
      }
    }

    return res.status(200).json({
      tier: activeSubscription.tier || 'SUCCESS+ Insider',
      status: activeSubscription.status,
      currentPeriodEnd: activeSubscription.currentPeriodEnd,
      currentPeriodStart: activeSubscription.currentPeriodStart,
      cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
      provider: activeSubscription.provider,
      billingCycle: activeSubscription.billingCycle,
      stripeCustomerId: activeSubscription.stripeCustomerId,
      membershipTier: user.member?.membershipTier || 'Free',
      paymentMethod,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
