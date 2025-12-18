import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, SubscriptionStatus } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Disable body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to get raw body
async function getRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// Verify PayKickstart webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!secret) {
    console.warn('PAYKICKSTART_WEBHOOK_SECRET not configured, skipping signature verification');
    return true; // Allow in development, but log warning
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Generate unique ID
function generateId(): string {
  return `pk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Map PayKickstart status to our SubscriptionStatus
function mapSubscriptionStatus(pkStatus: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    'active': SubscriptionStatus.ACTIVE,
    'trialing': SubscriptionStatus.TRIALING,
    'cancelled': SubscriptionStatus.CANCELED,
    'canceled': SubscriptionStatus.CANCELED,
    'past_due': SubscriptionStatus.PAST_DUE,
    'paused': SubscriptionStatus.INACTIVE,
    'expired': SubscriptionStatus.CANCELED,
  };
  return statusMap[pkStatus.toLowerCase()] || SubscriptionStatus.INACTIVE;
}

// Map PayKickstart tier/product to our tier
function mapSubscriptionTier(productName: string): string {
  const tierMap: Record<string, string> = {
    'success plus': 'SUCCESS_PLUS',
    'collective': 'COLLECTIVE',
    'insider': 'INSIDER',
  };

  const normalizedName = productName.toLowerCase();
  for (const [key, value] of Object.entries(tierMap)) {
    if (normalizedName.includes(key)) {
      return value;
    }
  }
  return 'FREE';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get raw body for signature verification
    const rawBody = await getRawBody(req);

    // Verify webhook signature
    const signature = req.headers['x-paykickstart-signature'] as string || '';
    const webhookSecret = process.env.PAYKICKSTART_WEBHOOK_SECRET || '';

    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse the payload
    const event = JSON.parse(rawBody);
    const eventType = event.event_type || event.type;

// Handle different event types
    switch (eventType) {
      case 'subscription_created':
      case 'subscription.created':
        await handleSubscriptionCreated(event);
        break;

      case 'subscription_updated':
      case 'subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      case 'subscription_cancelled':
      case 'subscription_canceled':
      case 'subscription.cancelled':
      case 'subscription.canceled':
        await handleSubscriptionCancelled(event);
        break;

      case 'payment_failed':
      case 'payment.failed':
        await handlePaymentFailed(event);
        break;

      case 'payment_succeeded':
      case 'payment.succeeded':
        // Update subscription to active if it was past_due
        await handlePaymentSucceeded(event);
        break;

      default:
}

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error processing PayKickstart webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed', message: error.message });
  }
}

async function handleSubscriptionCreated(event: any) {
  const data = event.data || event;
  const subscriptionId = data.subscription_id || data.id;
  const customerId = data.customer_id || data.customer?.id;
  const email = data.customer_email || data.customer?.email;
  const productName = data.product_name || data.product?.name || '';
  const status = data.status || 'active';
  const billingCycle = data.billing_cycle || data.interval || 'monthly';
  const currentPeriodStart = data.current_period_start ? new Date(data.current_period_start * 1000) : new Date();
  const currentPeriodEnd = data.current_period_end ? new Date(data.current_period_end * 1000) : null;

  // Find or create user by email
  let user = await prisma.users.findUnique({ where: { email }, include: { member: true } });

  if (!user) {
    // Create a basic user account
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);

    user = await prisma.users.create({
      data: {
        id: generateId(),
        email,
        name: data.customer_name || email.split('@')[0],
        password: hashedPassword,
        role: 'EDITOR',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: { member: true },
    });
  }

  // Find or create member for subscription
  let member = user.member;
  if (!member) {
    member = await prisma.members.create({
      data: {
        id: generateId(),
        email,
        firstName: (data.customer_name || '').split(' ')[0] || email.split('@')[0],
        lastName: (data.customer_name || '').split(' ').slice(1).join(' ') || '',
        membershipTier: 'Customer',
        membershipStatus: 'Active',
        totalSpent: 0,
        lifetimeValue: 0,
        paykickstartCustomerId: customerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    // Link member to user
    await prisma.users.update({
      where: { id: user.id },
      data: { memberId: member.id },
    });
  }

  // Create subscription record - use paykickstartSubscriptionId for unique lookup
  const existingSubscription = await prisma.subscriptions.findUnique({
    where: { paykickstartSubscriptionId: subscriptionId },
  });

  const subscription = existingSubscription
    ? await prisma.subscriptions.update({
        where: { id: existingSubscription.id },
        data: {
          paykickstartCustomerId: customerId,
          provider: 'paykickstart',
          status: mapSubscriptionStatus(status),
          tier: mapSubscriptionTier(productName),
          billingCycle: billingCycle.toLowerCase(),
          currentPeriodStart,
          currentPeriodEnd,
          updatedAt: new Date(),
        },
      })
    : await prisma.subscriptions.create({
        data: {
          id: generateId(),
          memberId: member.id,
          paykickstartCustomerId: customerId,
          paykickstartSubscriptionId: subscriptionId,
          provider: 'paykickstart',
          status: mapSubscriptionStatus(status),
          tier: mapSubscriptionTier(productName),
          billingCycle: billingCycle.toLowerCase(),
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

  // Update member status based on subscription
  await prisma.members.update({
    where: { id: member.id },
    data: {
      membershipStatus: mapSubscriptionStatus(status) === 'ACTIVE' ? 'Active' : 'Inactive',
      updatedAt: new Date(),
    },
  });

  // Log activity
  await prisma.activity_logs.create({
    data: {
      id: generateId(),
      userId: user.id,
      action: 'SUBSCRIPTION_CREATED',
      entity: 'subscription',
      entityId: subscription.id,
      details: JSON.stringify({
        provider: 'paykickstart',
        subscriptionId,
        tier: subscription.tier,
        status,
      }),
      createdAt: new Date(),
    },
  });

}

async function handleSubscriptionUpdated(event: any) {
  const data = event.data || event;
  const subscriptionId = data.subscription_id || data.id;
  const status = data.status || 'active';
  const productName = data.product_name || data.product?.name || '';
  const currentPeriodStart = data.current_period_start ? new Date(data.current_period_start * 1000) : null;
  const currentPeriodEnd = data.current_period_end ? new Date(data.current_period_end * 1000) : null;

  // Find subscription by PayKickstart subscription ID
  const subscription = await prisma.subscriptions.findFirst({
    where: { paykickstartSubscriptionId: subscriptionId },
    include: { member: true },
  });

  if (!subscription) {
    console.warn(`Subscription not found: ${subscriptionId}`);
    return;
  }

  // Update subscription
  await prisma.subscriptions.update({
    where: { id: subscription.id },
    data: {
      status: mapSubscriptionStatus(status),
      tier: mapSubscriptionTier(productName),
      currentPeriodStart: currentPeriodStart || subscription.currentPeriodStart,
      currentPeriodEnd: currentPeriodEnd || subscription.currentPeriodEnd,
      updatedAt: new Date(),
    },
  });

  // Update member status
  if (subscription.memberId) {
    await prisma.members.update({
      where: { id: subscription.memberId },
      data: {
        membershipStatus: mapSubscriptionStatus(status) === 'ACTIVE' ? 'Active' : 'Inactive',
        updatedAt: new Date(),
      },
    });
  }

  // Log activity - find user through member's platformUser
  const linkedUser = await prisma.users.findFirst({
    where: { memberId: subscription.memberId },
  });
  if (linkedUser) {
    await prisma.activity_logs.create({
      data: {
        id: generateId(),
        userId: linkedUser.id,
        action: 'SUBSCRIPTION_UPDATED',
        entity: 'subscription',
        entityId: subscription.id,
        details: JSON.stringify({
          provider: 'paykickstart',
          subscriptionId,
          newStatus: status,
          tier: mapSubscriptionTier(productName),
        }),
        createdAt: new Date(),
      },
    });
  }

}

async function handleSubscriptionCancelled(event: any) {
  const data = event.data || event;
  const subscriptionId = data.subscription_id || data.id;
  const cancelAtPeriodEnd = data.cancel_at_period_end !== false; // Default to true

  // Find subscription
  const subscription = await prisma.subscriptions.findFirst({
    where: { paykickstartSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    console.warn(`Subscription not found: ${subscriptionId}`);
    return;
  }

  // Update subscription
  await prisma.subscriptions.update({
    where: { id: subscription.id },
    data: {
      status: cancelAtPeriodEnd ? subscription.status : 'canceled',
      cancelAtPeriodEnd,
      updatedAt: new Date(),
    },
  });

  // Update member status if cancelled immediately
  if (!cancelAtPeriodEnd && subscription.memberId) {
    await prisma.members.update({
      where: { id: subscription.memberId },
      data: {
        membershipStatus: 'Inactive',
        updatedAt: new Date(),
      },
    });
  }

  // Log activity - find linked user through member
  const cancelledUser = await prisma.users.findFirst({
    where: { memberId: subscription.memberId },
  });
  if (cancelledUser) {
    await prisma.activity_logs.create({
      data: {
        id: generateId(),
        userId: cancelledUser.id,
        action: 'SUBSCRIPTION_CANCELLED',
        entity: 'subscription',
        entityId: subscription.id,
        details: JSON.stringify({
          provider: 'paykickstart',
          subscriptionId,
          cancelAtPeriodEnd,
        }),
        createdAt: new Date(),
      },
    });
  }

}

async function handlePaymentFailed(event: any) {
  const data = event.data || event;
  const subscriptionId = data.subscription_id || data.subscription?.id;

  if (!subscriptionId) {
    console.warn('Payment failed event missing subscription_id');
    return;
  }

  // Find subscription
  const subscription = await prisma.subscriptions.findFirst({
    where: { paykickstartSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    console.warn(`Subscription not found: ${subscriptionId}`);
    return;
  }

  // Update to PAST_DUE status
  await prisma.subscriptions.update({
    where: { id: subscription.id },
    data: {
      status: 'past_due',
      updatedAt: new Date(),
    },
  });

  // Update member status
  if (subscription.memberId) {
    await prisma.members.update({
      where: { id: subscription.memberId },
      data: {
        membershipStatus: 'Inactive',
        updatedAt: new Date(),
      },
    });

    // Log activity - find linked user
    const failedUser = await prisma.users.findFirst({
      where: { memberId: subscription.memberId },
    });
    if (failedUser) {
      await prisma.activity_logs.create({
        data: {
          id: generateId(),
          userId: failedUser.id,
          action: 'PAYMENT_FAILED',
          entity: 'subscription',
          entityId: subscription.id,
          details: JSON.stringify({
            provider: 'paykickstart',
            subscriptionId,
            reason: data.failure_message || 'Payment failed',
          }),
          createdAt: new Date(),
        },
      });
    }
  }

}

async function handlePaymentSucceeded(event: any) {
  const data = event.data || event;
  const subscriptionId = data.subscription_id || data.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  // Find subscription
  const subscription = await prisma.subscriptions.findFirst({
    where: { paykickstartSubscriptionId: subscriptionId },
  });

  if (!subscription || subscription.status !== 'past_due') {
    return; // Only update if currently past_due
  }

  // Update to active
  await prisma.subscriptions.update({
    where: { id: subscription.id },
    data: {
      status: 'active',
      updatedAt: new Date(),
    },
  });

  // Update member status
  if (subscription.memberId) {
    await prisma.members.update({
      where: { id: subscription.memberId },
      data: {
        membershipStatus: 'Active',
        updatedAt: new Date(),
      },
    });

    // Log activity - find linked user
    const succeededUser = await prisma.users.findFirst({
      where: { memberId: subscription.memberId },
    });
    if (succeededUser) {
      await prisma.activity_logs.create({
        data: {
          id: generateId(),
          userId: succeededUser.id,
          action: 'PAYMENT_SUCCEEDED',
          entity: 'subscription',
          entityId: subscription.id,
          details: JSON.stringify({
            provider: 'paykickstart',
            subscriptionId,
          }),
          createdAt: new Date(),
        },
      });
    }
  }

}
