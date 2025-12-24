import { NextApiRequest, NextApiResponse } from 'next';

import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { nanoid } from 'nanoid';
import { createLogger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';

const log = createLogger('StripeWebhook');

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
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const supabase = supabaseAdmin();
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) {
    log.error('Missing customer or subscription ID in checkout session');
    return;
  }

  // Find member by Stripe customer ID
  const { data: members, error: memberError } = await supabase
    .from('members')
    .select(`
      *,
      users!members_linkedMemberId_fkey(*)
    `)
    .eq('stripeCustomerId', customerId)
    .limit(1);

  if (memberError || !members || members.length === 0) {
    log.error('No member found with Stripe customer ID', { customerId });
    return;
  }

  const member = members[0];
  const platformUser = member.users;

  // Get subscription details from Stripe
  const subscription = await stripe!.subscriptions.retrieve(subscriptionId);

  // Extract subscription data
  const subData: any = subscription;
  const currentPeriodStart = subData.current_period_start || subData.currentPeriodStart;
  const currentPeriodEnd = subData.current_period_end || subData.currentPeriodEnd;
  const cancelAtPeriodEnd = subData.cancel_at_period_end ?? subData.cancelAtPeriodEnd ?? false;

  // Check if subscription already exists
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripeSubscriptionId', subscriptionId)
    .single();

  // Create or update subscription record
  if (existingSub) {
    await supabase
      .from('subscriptions')
      .update({
        status: subscription.status.toUpperCase(),
        currentPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
        currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
        cancelAtPeriodEnd,
        updatedAt: new Date().toISOString(),
      })
      .eq('stripeSubscriptionId', subscriptionId);
  } else {
    await supabase
      .from('subscriptions')
      .insert({
        id: nanoid(),
        memberId: member.id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: subscription.items.data[0]?.price.id,
        provider: 'stripe',
        status: subscription.status.toUpperCase(),
        tier: 'SUCCESS_PLUS',
        currentPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
        currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
        cancelAtPeriodEnd,
        billingCycle: subscription.items.data[0]?.price.recurring?.interval?.toUpperCase() || 'MONTHLY',
        updatedAt: new Date().toISOString(),
      });
  }

  // Update member tier and clear trial
  await supabase
    .from('members')
    .update({
      membershipTier: 'SUCCESSPlus',
      membershipStatus: 'Active',
      trialEndsAt: null,
      trialStartedAt: null,
    })
    .eq('id', member.id);

  // Clear trial from platform user if linked
  if (platformUser) {
    await supabase
      .from('users')
      .update({
        trialEndsAt: null,
      })
      .eq('id', platformUser.id);
  }

  // Log activity
  if (platformUser) {
    await supabase
      .from('user_activities')
      .insert({
        id: nanoid(),
        userId: platformUser.id,
        activityType: 'SUBSCRIPTION_STARTED',
        title: 'SUCCESS+ Subscription Activated',
        description: 'Subscription activated via Stripe payment',
        metadata: JSON.stringify({
          subscriptionId,
          customerId,
          tier: 'SUCCESS_PLUS',
        }),
      });
  }

  log.info('Subscription activated for member', { email: member.email });
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const supabase = supabaseAdmin();
  const subscriptionId = subscription.id;
  const customerId = subscription.customer as string;

  // Find existing subscription
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      members!subscriptions_memberId_fkey(
        *,
        users!members_linkedMemberId_fkey(*)
      )
    `)
    .eq('stripeSubscriptionId', subscriptionId)
    .single();

  // Extract subscription data
  const subData: any = subscription;
  const currentPeriodStart = subData.current_period_start || subData.currentPeriodStart;
  const currentPeriodEnd = subData.current_period_end || subData.currentPeriodEnd;
  const cancelAtPeriodEnd = subData.cancel_at_period_end ?? subData.cancelAtPeriodEnd ?? false;

  if (!existingSubscription) {
    // If subscription doesn't exist, it might be a new subscription
    // Find member by customer ID and create subscription
    const { data: members } = await supabase
      .from('members')
      .select('*')
      .eq('stripeCustomerId', customerId)
      .limit(1);

    if (members && members.length > 0) {
      const member = members[0];
      await supabase
        .from('subscriptions')
        .insert({
          id: nanoid(),
          memberId: member.id,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripePriceId: subscription.items.data[0]?.price.id,
          provider: 'stripe',
          status: subscription.status.toUpperCase(),
          tier: 'SUCCESS_PLUS',
          currentPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
          currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
          cancelAtPeriodEnd,
          billingCycle: subscription.items.data[0]?.price.recurring?.interval?.toUpperCase() || 'MONTHLY',
          updatedAt: new Date().toISOString(),
        });

      // Update member tier
      await supabase
        .from('members')
        .update({
          membershipTier: 'SUCCESSPlus',
          membershipStatus: 'Active',
        })
        .eq('id', member.id);
    }
    return;
  }

  // Update existing subscription
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status.toUpperCase(),
      currentPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
      currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
      cancelAtPeriodEnd,
      updatedAt: new Date().toISOString(),
    })
    .eq('stripeSubscriptionId', subscriptionId);

  // Update member status based on subscription status
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';

  await supabase
    .from('members')
    .update({
      membershipTier: isActive ? 'SUCCESSPlus' : 'Free',
      membershipStatus: isActive ? 'Active' : 'Inactive',
    })
    .eq('id', existingSubscription.memberId);

  log.info('Subscription updated', { subscriptionId, status: subscription.status });
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = supabaseAdmin();
  const subscriptionId = subscription.id;

  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      members!subscriptions_memberId_fkey(
        *,
        users!members_linkedMemberId_fkey(*)
      )
    `)
    .eq('stripeSubscriptionId', subscriptionId)
    .single();

  if (!existingSubscription) {
    log.error('Subscription not found', { subscriptionId });
    return;
  }

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'CANCELED',
      updatedAt: new Date().toISOString(),
    })
    .eq('stripeSubscriptionId', subscriptionId);

  // Downgrade member to Free tier
  await supabase
    .from('members')
    .update({
      membershipTier: 'Free',
      membershipStatus: 'Inactive',
    })
    .eq('id', existingSubscription.memberId);

  // Log activity
  const member = existingSubscription.members;
  const platformUser = member?.users;
  if (platformUser) {
    void supabase
      .from('user_activities')
      .insert({
        id: nanoid(),
        userId: platformUser.id,
        activityType: 'SUBSCRIPTION_STARTED',
        title: 'Subscription Cancelled',
        description: 'SUCCESS+ subscription has been cancelled',
        metadata: JSON.stringify({
          subscriptionId,
          canceledAt: new Date().toISOString(),
        }),
      });
  }

  log.info('Subscription cancelled', { subscriptionId });
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const supabase = supabaseAdmin();
  const invoiceData: any = invoice;
  const subscriptionId = invoiceData.subscription as string;

  if (!subscriptionId) {
    return;
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      members!subscriptions_memberId_fkey(*)
    `)
    .eq('stripeSubscriptionId', subscriptionId)
    .single();

  if (subscription) {
    // Update last payment date
    await supabase
      .from('subscriptions')
      .update({
        updatedAt: new Date().toISOString(),
      })
      .eq('stripeSubscriptionId', subscriptionId);

    log.info('Payment succeeded for subscription', { subscriptionId });
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = supabaseAdmin();
  const invoiceData: any = invoice;
  const subscriptionId = invoiceData.subscription as string;

  if (!subscriptionId) {
    return;
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      members!subscriptions_memberId_fkey(
        *,
        users!members_linkedMemberId_fkey(*)
      )
    `)
    .eq('stripeSubscriptionId', subscriptionId)
    .single();

  if (subscription) {
    // Update subscription status
    await supabase
      .from('subscriptions')
      .update({
        status: 'PAST_DUE',
        updatedAt: new Date().toISOString(),
      })
      .eq('stripeSubscriptionId', subscriptionId);

    // Log activity
    const member = subscription.members;
    const platformUser = member?.users;
    if (platformUser) {
      void supabase
        .from('user_activities')
        .insert({
          id: nanoid(),
          userId: platformUser.id,
          activityType: 'SUBSCRIPTION_STARTED',
          title: 'Payment Failed',
          description: 'Subscription payment failed - please update payment method',
          metadata: JSON.stringify({
            subscriptionId,
            invoiceId: invoice.id,
          }),
        });
    }

    log.info('Payment failed for subscription', { subscriptionId });
  }
}
