import { prisma } from '../../../lib/prisma';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

export default async function handler(req, res) {
  // Require admin authentication for subscription management
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }

  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      return getSubscription(req, res, id);
    case 'DELETE':
      return cancelSubscription(req, res, id);
    case 'PATCH':
      return updateSubscription(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getSubscription(req, res, id) {
  try {
    const subscription = await prisma.subscriptions.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    return res.status(200).json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function cancelSubscription(req, res, id) {
  try {
    // Get subscription from database
    const subscription = await prisma.subscriptions.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // If subscription has a Stripe ID, cancel it in Stripe first
    if (subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        console.log(`✓ Stripe subscription ${subscription.stripeSubscriptionId} set to cancel at period end`);
      } catch (stripeError) {
        console.error('Error canceling Stripe subscription:', stripeError);

        // If Stripe cancellation fails, don't update database
        return res.status(500).json({
          message: 'Failed to cancel subscription in Stripe',
          error: stripeError.message,
        });
      }
    }

    // Update database to reflect cancellation
    const updatedSubscription = await prisma.subscriptions.update({
      where: { id },
      data: {
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      },
    });

    // Log the cancellation
    console.log(`✓ Subscription ${id} canceled by admin. Will end on ${subscription.currentPeriodEnd}`);

    return res.status(200).json({
      message: 'Subscription canceled successfully. Will remain active until end of billing period.',
      subscription: updatedSubscription,
      endDate: subscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

async function updateSubscription(req, res, id) {
  try {
    const { action } = req.body;

    if (!action) {
      return res.status(400).json({ message: 'Action is required (pause, resume, cancel)' });
    }

    // Get subscription from database
    const subscription = await prisma.subscriptions.findUnique({
      where: { id },
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (!subscription.stripeSubscriptionId) {
      return res.status(400).json({ message: 'Subscription does not have a Stripe ID' });
    }

    let updatedStripeSubscription;
    let dbUpdate = {};

    switch (action) {
      case 'pause':
        // Pause subscription in Stripe
        updatedStripeSubscription = await stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            pause_collection: {
              behavior: 'mark_uncollectible',
            },
          }
        );

        dbUpdate = {
          status: 'paused',
          updatedAt: new Date(),
        };

        console.log(`✓ Subscription ${id} paused in Stripe`);
        break;

      case 'resume':
        // Resume subscription in Stripe
        updatedStripeSubscription = await stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            pause_collection: null,
          }
        );

        dbUpdate = {
          status: 'active',
          updatedAt: new Date(),
        };

        console.log(`✓ Subscription ${id} resumed in Stripe`);
        break;

      case 'cancel':
        // Immediate cancellation (not at period end)
        updatedStripeSubscription = await stripe.subscriptions.cancel(
          subscription.stripeSubscriptionId
        );

        dbUpdate = {
          status: 'canceled',
          cancelAtPeriodEnd: false,
          updatedAt: new Date(),
        };

        console.log(`✓ Subscription ${id} canceled immediately in Stripe`);
        break;

      default:
        return res.status(400).json({ message: 'Invalid action. Use: pause, resume, or cancel' });
    }

    // Update database to match Stripe
    const updatedSubscription = await prisma.subscriptions.update({
      where: { id },
      data: dbUpdate,
    });

    return res.status(200).json({
      message: `Subscription ${action}d successfully`,
      subscription: updatedSubscription,
      stripeData: updatedStripeSubscription,
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return res.status(500).json({
      message: 'Failed to update subscription',
      error: error.message,
    });
  }
}
