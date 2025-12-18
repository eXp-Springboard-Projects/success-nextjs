import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { nanoid } from 'nanoid';
import { createLogger } from '@/lib/logger';

const log = createLogger('StripeWebhook');
const prisma = new PrismaClient();

// Disable body parsing, need raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    log.error('STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Verify Stripe is configured
    if (!stripe) {
      log.error('Stripe is not configured');
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      log.error('Webhook signature verification failed', err);
      return res.status(400).json({
        error: 'Webhook signature verification failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      });
    }

    log.info('Received Stripe webhook', { eventType: event.type });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        log.debug('Unhandled event type', { eventType: event.type });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    log.error('Webhook error', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) {
    log.error('Missing customer or subscription ID in checkout session');
    return;
  }

  // Find member by Stripe customer ID
  const member = await prisma.members.findFirst({
    where: { stripeCustomerId: customerId },
    include: {
      platformUser: true,
    },
  });

  if (!member) {
    log.error('No member found with Stripe customer ID', { customerId });
    return;
  }

  // Get subscription details from Stripe
  const subscription = await stripe!.subscriptions.retrieve(subscriptionId);

  // Extract subscription data
  const subData: any = subscription;
  const currentPeriodStart = subData.current_period_start || subData.currentPeriodStart;
  const currentPeriodEnd = subData.current_period_end || subData.currentPeriodEnd;
  const cancelAtPeriodEnd = subData.cancel_at_period_end ?? subData.cancelAtPeriodEnd ?? false;

  // Create or update subscription record
  await prisma.subscriptions.upsert({
    where: {
      stripeSubscriptionId: subscriptionId,
    },
    create: {
      id: nanoid(),
      memberId: member.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: subscription.items.data[0]?.price.id,
      provider: 'stripe',
      status: subscription.status.toUpperCase(),
      tier: 'SUCCESS_PLUS',
      currentPeriodStart: new Date(currentPeriodStart * 1000),
      currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      cancelAtPeriodEnd,
      billingCycle: subscription.items.data[0]?.price.recurring?.interval?.toUpperCase() || 'MONTHLY',
      updatedAt: new Date(),
    },
    update: {
      status: subscription.status.toUpperCase(),
      currentPeriodStart: new Date(currentPeriodStart * 1000),
      currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      cancelAtPeriodEnd,
      updatedAt: new Date(),
    },
  });

  // Update member tier and clear trial
  await prisma.members.update({
    where: { id: member.id },
    data: {
      membershipTier: 'SUCCESSPlus',
      membershipStatus: 'Active',
      trialEndsAt: null,
      trialStartedAt: null,
    },
  });

  // Clear trial from platform user if linked
  if (member.platformUser) {
    await prisma.users.update({
      where: { id: member.platformUser.id },
      data: {
        trialEndsAt: null,
      },
    });
  }

  // Log activity
  if (member.platformUser) {
    await prisma.user_activities.create({
      data: {
        id: nanoid(),
        userId: member.platformUser.id,
        activityType: 'SUBSCRIPTION_STARTED',
        title: 'SUCCESS+ Subscription Activated',
        description: 'Subscription activated via Stripe payment',
        metadata: JSON.stringify({
          subscriptionId,
          customerId,
          tier: 'SUCCESS_PLUS',
        }),
      },
    }).catch(() => {
      // Ignore activity logging errors
    });
  }

  log.info('Subscription activated for member', { email: member.email });
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;
  const customerId = subscription.customer as string;

  // Find existing subscription
  const existingSubscription = await prisma.subscriptions.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: {
      member: {
        include: {
          platformUser: true,
        },
      },
    },
  });

  // Extract subscription data
  const subData: any = subscription;
  const currentPeriodStart = subData.current_period_start || subData.currentPeriodStart;
  const currentPeriodEnd = subData.current_period_end || subData.currentPeriodEnd;
  const cancelAtPeriodEnd = subData.cancel_at_period_end ?? subData.cancelAtPeriodEnd ?? false;

  if (!existingSubscription) {
    // If subscription doesn't exist, it might be a new subscription
    // Find member by customer ID and create subscription
    const member = await prisma.members.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (member) {
      await prisma.subscriptions.create({
        data: {
          id: nanoid(),
          memberId: member.id,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripePriceId: subscription.items.data[0]?.price.id,
          provider: 'stripe',
          status: subscription.status.toUpperCase(),
          tier: 'SUCCESS_PLUS',
          currentPeriodStart: new Date(currentPeriodStart * 1000),
          currentPeriodEnd: new Date(currentPeriodEnd * 1000),
          cancelAtPeriodEnd,
          billingCycle: subscription.items.data[0]?.price.recurring?.interval?.toUpperCase() || 'MONTHLY',
          updatedAt: new Date(),
        },
      });

      // Update member tier
      await prisma.members.update({
        where: { id: member.id },
        data: {
          membershipTier: 'SUCCESSPlus',
          membershipStatus: 'Active',
        },
      });
    }
    return;
  }

  // Update existing subscription
  await prisma.subscriptions.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: subscription.status.toUpperCase(),
      currentPeriodStart: new Date(currentPeriodStart * 1000),
      currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      cancelAtPeriodEnd,
      updatedAt: new Date(),
    },
  });

  // Update member status based on subscription status
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';

  await prisma.members.update({
    where: { id: existingSubscription.memberId },
    data: {
      membershipTier: isActive ? 'SUCCESSPlus' : 'Free',
      membershipStatus: isActive ? 'Active' : 'Inactive',
    },
  });

  log.info('Subscription updated', { subscriptionId, status: subscription.status });
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;

  const existingSubscription = await prisma.subscriptions.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: {
      member: {
        include: {
          platformUser: true,
        },
      },
    },
  });

  if (!existingSubscription) {
    log.error('Subscription not found', { subscriptionId });
    return;
  }

  // Update subscription status
  await prisma.subscriptions.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: 'CANCELED',
      updatedAt: new Date(),
    },
  });

  // Downgrade member to Free tier
  await prisma.members.update({
    where: { id: existingSubscription.memberId },
    data: {
      membershipTier: 'Free',
      membershipStatus: 'Inactive',
    },
  });

  // Log activity
  if (existingSubscription.member.platformUser) {
    await prisma.user_activities.create({
      data: {
        id: nanoid(),
        userId: existingSubscription.member.platformUser.id,
        activityType: 'SUBSCRIPTION_STARTED',
        title: 'Subscription Cancelled',
        description: 'SUCCESS+ subscription has been cancelled',
        metadata: JSON.stringify({
          subscriptionId,
          canceledAt: new Date().toISOString(),
        }),
      },
    }).catch(() => {
      // Ignore activity logging errors
    });
  }

  log.info('Subscription cancelled', { subscriptionId });
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const invoiceData: any = invoice;
  const subscriptionId = invoiceData.subscription as string;

  if (!subscriptionId) {
    return;
  }

  const subscription = await prisma.subscriptions.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: {
      member: true,
    },
  });

  if (subscription) {
    // Update last payment date
    await prisma.subscriptions.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        updatedAt: new Date(),
      },
    });

    log.info('Payment succeeded for subscription', { subscriptionId });
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceData: any = invoice;
  const subscriptionId = invoiceData.subscription as string;

  if (!subscriptionId) {
    return;
  }

  const subscription = await prisma.subscriptions.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: {
      member: {
        include: {
          platformUser: true,
        },
      },
    },
  });

  if (subscription) {
    // Update subscription status
    await prisma.subscriptions.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: 'PAST_DUE',
        updatedAt: new Date(),
      },
    });

    // Log activity
    if (subscription.member.platformUser) {
      await prisma.user_activities.create({
        data: {
          id: nanoid(),
          userId: subscription.member.platformUser.id,
          activityType: 'SUBSCRIPTION_STARTED',
          title: 'Payment Failed',
          description: 'Subscription payment failed - please update payment method',
          metadata: JSON.stringify({
            subscriptionId,
            invoiceId: invoice.id,
          }),
        },
      }).catch(() => {
        // Ignore activity logging errors
      });
    }

    log.info('Payment failed for subscription', { subscriptionId });
  }
}
