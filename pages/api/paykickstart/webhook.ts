import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { randomUUID } from 'crypto';

// Subscription status enum
enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
  INACTIVE = 'INACTIVE'
}

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
  return randomUUID();
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
    return res.status(500).json({ error: 'Webhook processing failed', message: error.message });
  }
}

async function handleSubscriptionCreated(event: any) {
  const supabase = supabaseAdmin();
  const data = event.data || event;
  const subscriptionId = data.subscription_id || data.id;
  const customerId = data.customer_id || data.customer?.id;
  const email = data.customer_email || data.customer?.email;
  const productName = data.product_name || data.product?.name || '';
  const status = data.status || 'active';
  const billingCycle = data.billing_cycle || data.interval || 'monthly';
  const currentPeriodStart = data.current_period_start ? new Date(data.current_period_start * 1000).toISOString() : new Date().toISOString();
  const currentPeriodEnd = data.current_period_end ? new Date(data.current_period_end * 1000).toISOString() : null;

  // Find or create user by email
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id, email, name, memberId')
    .eq('email', email)
    .limit(1);

  let user = existingUsers?.[0];

  if (!user) {
    // Create a basic user account
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);
    const userId = generateId();

    const { data: newUser } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name: data.customer_name || email.split('@')[0],
        password: hashedPassword,
        role: 'EDITOR',
        emailVerified: true,
      })
      .select()
      .single();

    user = newUser;
  }

  // Find or create member for subscription
  let member;
  if (user && user.memberId) {
    const { data: existingMember } = await supabase
      .from('members')
      .select('*')
      .eq('id', user.memberId)
      .single();
    member = existingMember;
  }

  if (!member && user) {
    const memberId = generateId();
    const { data: newMember } = await supabase
      .from('members')
      .insert({
        id: memberId,
        email,
        firstName: (data.customer_name || '').split(' ')[0] || email.split('@')[0],
        lastName: (data.customer_name || '').split(' ').slice(1).join(' ') || '',
        membershipTier: 'Customer',
        membershipStatus: 'Active',
        totalSpent: 0,
        lifetimeValue: 0,
        paykickstartCustomerId: customerId,
      })
      .select()
      .single();

    member = newMember;

    // Link member to user
    if (member) {
      await supabase
        .from('users')
        .update({ memberId: member.id })
        .eq('id', user.id);
    }
  }

  // Create subscription record - use paykickstartSubscriptionId for unique lookup
  const { data: existingSubscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('paykickstartSubscriptionId', subscriptionId)
    .limit(1);

  const existingSubscription = existingSubscriptions?.[0];

  let subscription;
  if (existingSubscription) {
    const { data: updatedSubscription } = await supabase
      .from('subscriptions')
      .update({
        paykickstartCustomerId: customerId,
        provider: 'paykickstart',
        status: mapSubscriptionStatus(status),
        tier: mapSubscriptionTier(productName),
        billingCycle: billingCycle.toLowerCase(),
        currentPeriodStart,
        currentPeriodEnd,
      })
      .eq('id', existingSubscription.id)
      .select()
      .single();
    subscription = updatedSubscription;
  } else {
    const { data: newSubscription } = await supabase
      .from('subscriptions')
      .insert({
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
      })
      .select()
      .single();
    subscription = newSubscription;
  }

  // Update member status based on subscription
  await supabase
    .from('members')
    .update({
      membershipStatus: mapSubscriptionStatus(status) === 'ACTIVE' ? 'Active' : 'Inactive',
    })
    .eq('id', member.id);

  // Log activity
  if (user) {
    await supabase
      .from('activity_logs')
      .insert({
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
    });
  }
}

async function handleSubscriptionUpdated(event: any) {
  const supabase = supabaseAdmin();
  const data = event.data || event;
  const subscriptionId = data.subscription_id || data.id;
  const status = data.status || 'active';
  const productName = data.product_name || data.product?.name || '';
  const currentPeriodStart = data.current_period_start ? new Date(data.current_period_start * 1000).toISOString() : null;
  const currentPeriodEnd = data.current_period_end ? new Date(data.current_period_end * 1000).toISOString() : null;

  // Find subscription by PayKickstart subscription ID
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('paykickstartSubscriptionId', subscriptionId)
    .limit(1);

  const subscription = subscriptions?.[0];

  if (!subscription) {
    return;
  }

  // Update subscription
  await supabase
    .from('subscriptions')
    .update({
      status: mapSubscriptionStatus(status),
      tier: mapSubscriptionTier(productName),
      currentPeriodStart: currentPeriodStart || subscription.currentPeriodStart,
      currentPeriodEnd: currentPeriodEnd || subscription.currentPeriodEnd,
    })
    .eq('id', subscription.id);

  // Update member status
  if (subscription.memberId) {
    await supabase
      .from('members')
      .update({
        membershipStatus: mapSubscriptionStatus(status) === 'ACTIVE' ? 'Active' : 'Inactive',
      })
      .eq('id', subscription.memberId);
  }

  // Log activity - find user through member's platformUser
  const { data: linkedUsers } = await supabase
    .from('users')
    .select('*')
    .eq('memberId', subscription.memberId)
    .limit(1);

  const linkedUser = linkedUsers?.[0];
  if (linkedUser) {
    await supabase
      .from('activity_logs')
      .insert({
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
      });
  }

}

async function handleSubscriptionCancelled(event: any) {
  const supabase = supabaseAdmin();
  const data = event.data || event;
  const subscriptionId = data.subscription_id || data.id;
  const cancelAtPeriodEnd = data.cancel_at_period_end !== false; // Default to true

  // Find subscription
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('paykickstartSubscriptionId', subscriptionId)
    .limit(1);

  const subscription = subscriptions?.[0];

  if (!subscription) {
    return;
  }

  // Update subscription
  await supabase
    .from('subscriptions')
    .update({
      status: cancelAtPeriodEnd ? subscription.status : 'canceled',
      cancelAtPeriodEnd,
    })
    .eq('id', subscription.id);

  // Update member status if cancelled immediately
  if (!cancelAtPeriodEnd && subscription.memberId) {
    await supabase
      .from('members')
      .update({
        membershipStatus: 'Inactive',
      })
      .eq('id', subscription.memberId);
  }

  // Log activity - find linked user through member
  const { data: cancelledUsers } = await supabase
    .from('users')
    .select('*')
    .eq('memberId', subscription.memberId)
    .limit(1);

  const cancelledUser = cancelledUsers?.[0];
  if (cancelledUser) {
    await supabase
      .from('activity_logs')
      .insert({
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
      });
  }

}

async function handlePaymentFailed(event: any) {
  const supabase = supabaseAdmin();
  const data = event.data || event;
  const subscriptionId = data.subscription_id || data.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  // Find subscription
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('paykickstartSubscriptionId', subscriptionId)
    .limit(1);

  const subscription = subscriptions?.[0];

  if (!subscription) {
    return;
  }

  // Update to PAST_DUE status
  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('id', subscription.id);

  // Update member status
  if (subscription.memberId) {
    await supabase
      .from('members')
      .update({
        membershipStatus: 'Inactive',
      })
      .eq('id', subscription.memberId);

    // Log activity - find linked user
    const { data: failedUsers } = await supabase
      .from('users')
      .select('*')
      .eq('memberId', subscription.memberId)
      .limit(1);

    const failedUser = failedUsers?.[0];
    if (failedUser) {
      await supabase
        .from('activity_logs')
        .insert({
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
        });
    }
  }

}

async function handlePaymentSucceeded(event: any) {
  const supabase = supabaseAdmin();
  const data = event.data || event;
  const subscriptionId = data.subscription_id || data.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  // Find subscription
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('paykickstartSubscriptionId', subscriptionId)
    .limit(1);

  const subscription = subscriptions?.[0];

  if (!subscription || subscription.status !== 'past_due') {
    return; // Only update if currently past_due
  }

  // Update to active
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
    })
    .eq('id', subscription.id);

  // Update member status
  if (subscription.memberId) {
    await supabase
      .from('members')
      .update({
        membershipStatus: 'Active',
      })
      .eq('id', subscription.memberId);

    // Log activity - find linked user
    const { data: succeededUsers } = await supabase
      .from('users')
      .select('*')
      .eq('memberId', subscription.memberId)
      .limit(1);

    const succeededUser = succeededUsers?.[0];
    if (succeededUser) {
      await supabase
        .from('activity_logs')
        .insert({
          id: generateId(),
          userId: succeededUser.id,
          action: 'PAYMENT_SUCCEEDED',
          entity: 'subscription',
          entityId: subscription.id,
          details: JSON.stringify({
            provider: 'paykickstart',
            subscriptionId,
          }),
        });
    }
  }

}
