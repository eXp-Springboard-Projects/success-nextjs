import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only admins can manage subscriptions
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid subscription ID' });
    }

    // GET - Get subscription details
    if (req.method === 'GET') {
      const subscription = await prisma.subscriptions.findUnique({
        where: { id },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              membershipTier: true,
              membershipStatus: true,
            },
          },
        },
      });

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      return res.status(200).json(subscription);
    }

    // PATCH - Update subscription (pause/resume)
    if (req.method === 'PATCH') {
      const { action } = req.body;

      const subscription = await prisma.subscriptions.findUnique({
        where: { id },
      });

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      if (!stripe) {
        return res.status(500).json({ error: 'Stripe not configured' });
      }

      if (subscription.provider !== 'stripe' || !subscription.stripeSubscriptionId) {
        return res.status(400).json({ error: 'Can only manage Stripe subscriptions through this endpoint' });
      }

      try {
        if (action === 'pause') {
          // Pause subscription - will stop at end of current period
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            pause_collection: {
              behavior: 'mark_uncollectible',
            },
          });

          await prisma.subscriptions.update({
            where: { id },
            data: {
              status: 'PAUSED',
              updatedAt: new Date(),
            },
          });

          return res.status(200).json({
            message: 'Subscription paused. Customer will not be charged at next billing cycle.',
          });
        }

        if (action === 'resume') {
          // Resume paused subscription
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            pause_collection: null,
          });

          await prisma.subscriptions.update({
            where: { id },
            data: {
              status: 'ACTIVE',
              updatedAt: new Date(),
            },
          });

          return res.status(200).json({
            message: 'Subscription resumed. Billing will continue normally.',
          });
        }

        return res.status(400).json({ error: 'Invalid action. Use "pause" or "resume"' });
      } catch (stripeError: any) {
        console.error('Stripe error:', stripeError);
        return res.status(500).json({ error: stripeError.message || 'Failed to update subscription in Stripe' });
      }
    }

    // DELETE - Cancel subscription
    if (req.method === 'DELETE') {
      const subscription = await prisma.subscriptions.findUnique({
        where: { id },
      });

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      if (!stripe) {
        return res.status(500).json({ error: 'Stripe not configured' });
      }

      if (subscription.provider !== 'stripe' || !subscription.stripeSubscriptionId) {
        return res.status(400).json({ error: 'Can only cancel Stripe subscriptions through this endpoint' });
      }

      try {
        // Cancel at end of billing period
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        await prisma.subscriptions.update({
          where: { id },
          data: {
            cancelAtPeriodEnd: true,
            status: 'CANCELLING',
            updatedAt: new Date(),
          },
        });

        return res.status(200).json({
          message: 'Subscription will be cancelled at end of billing period.',
          endsAt: subscription.currentPeriodEnd,
        });
      } catch (stripeError: any) {
        console.error('Stripe error:', stripeError);
        return res.status(500).json({ error: stripeError.message || 'Failed to cancel subscription in Stripe' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Subscription API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
