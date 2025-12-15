import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { nanoid } from 'nanoid';

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
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({
        error: 'Webhook signature verification failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      });
    }

    console.log(`Received Stripe webhook: ${event.type}`);

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
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
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
    console.error('Missing customer or subscription ID in checkout session');
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
    console.error(`No member found with Stripe customer ID: ${customerId}`);
    return;
  }

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

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
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      billingCycle: subscription.items.data[0]?.price.recurring?.interval?.toUpperCase() || 'MONTHLY',
      updatedAt: new Date(),
    },
    update: {
      status: subscription.status.toUpperCase(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
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

  console.log(`✅ Subscription activated for member: ${member.email}`);
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
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
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
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
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

  console.log(`✅ Subscription updated: ${subscriptionId} - Status: ${subscription.status}`);
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
    console.error(`Subscription not found: ${subscriptionId}`);
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

  console.log(`❌ Subscription cancelled: ${subscriptionId}`);
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

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

    console.log(`✅ Payment succeeded for subscription: ${subscriptionId}`);
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

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

    console.log(`❌ Payment failed for subscription: ${subscriptionId}`);
  }
}
