import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';

import { randomUUID } from 'crypto';
import { createLogger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';

const log = createLogger('StripeWebhook');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

// Disable body parsing, need raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Send magazine subscription to C+W fulfillment system
 */
async function sendToCWFulfillment(subscription: any, customer: any) {
  const supabase = supabaseAdmin();
  const cwWebhookUrl = process.env.CW_WEBHOOK_URL;
  const cwWebhookSecret = process.env.CW_WEBHOOK_SECRET;

  if (!cwWebhookUrl) {
    log.warn('CW_WEBHOOK_URL not configured, skipping magazine fulfillment');
    return;
  }

  try {
    const response = await fetch(cwWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cwWebhookSecret || ''}`,
      },
      body: JSON.stringify({
        event: 'subscription.created',
        timestamp: new Date().toISOString(),
        subscription_id: subscription.id,
        customer: {
          email: customer.email,
          name: customer.name || '',
          shipping_address: customer.shipping || customer.address || {},
        },
        tier: subscription.metadata.tier,
        billing_cycle: subscription.metadata.billingCycle,
        start_date: new Date(subscription.current_period_start * 1000).toISOString(),
        status: subscription.status,
      }),
    });

    if (!response.ok) {
      throw new Error(`C+W webhook failed: ${response.status} ${response.statusText}`);
    }

    await response.json();
  } catch (error) {
    log.error('Failed to send to C+W fulfillment', error);
    // Log to database for manual retry
    await supabase
      .from('activity_logs')
      .insert({
        id: randomUUID(),
        userId: subscription.metadata.userId || 'system',
        action: 'CW_FULFILLMENT_FAILED',
        entity: 'subscription',
        details: JSON.stringify({
          subscriptionId: subscription.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        ipAddress: '',
      });
  }
}

/**
 * Send welcome email to new subscriber
 */
async function sendWelcomeEmail(email: string, tier: string, billingCycle: string) {
  // TODO: Implement email sending with SendGrid/Resend
  log.debug('Welcome email pending implementation', { email, tier, billingCycle });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    log.error('Webhook signature verification failed', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.subscription) {
          // Get subscription and customer details
          const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const customer = await stripe.customers.retrieve(
            session.customer as string
          ) as Stripe.Customer;

          const supabase = supabaseAdmin();
          const tier = session.metadata?.tier || 'collective';
          const billingCycle = session.metadata?.billingCycle || 'monthly';
          const userId = session.metadata?.userId;

          // Find or create member for subscription
          let { data: memberResults } = await supabase
            .from('members')
            .select('*')
            .eq('stripeCustomerId', customer.id)
            .limit(1);

          let member = memberResults && memberResults.length > 0 ? memberResults[0] : null;

          if (!member && customer.email) {
            const { data: emailResults } = await supabase
              .from('members')
              .select('*')
              .eq('email', customer.email)
              .limit(1);
            member = emailResults && emailResults.length > 0 ? emailResults[0] : null;
          }

          if (!member && customer.email) {
            const { data: newMember } = await supabase
              .from('members')
              .insert({
                id: randomUUID(),
                email: customer.email,
                firstName: customer.name?.split(' ')[0] || customer.email.split('@')[0],
                lastName: customer.name?.split(' ').slice(1).join(' ') || '',
                stripeCustomerId: customer.id,
                membershipTier: 'Customer',
                membershipStatus: 'Active',
                totalSpent: 0,
                lifetimeValue: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
              .select()
              .single();
            member = newMember;
          }

          // Create or update subscription in database
          const subscriptionAny = subscription as any;
          const currentPeriodStart = subscriptionAny.current_period_start
            ? new Date(subscriptionAny.current_period_start * 1000).toISOString()
            : new Date().toISOString();
          const currentPeriodEnd = subscriptionAny.current_period_end
            ? new Date(subscriptionAny.current_period_end * 1000).toISOString()
            : new Date().toISOString();

          // Check if subscription exists
          const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('stripeSubscriptionId', subscription.id)
            .single();

          let dbSubscription;
          if (existingSub) {
            const { data } = await supabase
              .from('subscriptions')
              .update({
                status: subscription.status,
                currentPeriodStart,
                currentPeriodEnd,
                cancelAtPeriodEnd: subscriptionAny.cancel_at_period_end || false,
              })
              .eq('stripeSubscriptionId', subscription.id)
              .select()
              .single();
            dbSubscription = data;
          } else {
            const { data } = await supabase
              .from('subscriptions')
              .insert({
                id: randomUUID(),
                memberId: member!.id,
                stripeCustomerId: customer.id,
                stripeSubscriptionId: subscription.id,
                tier,
                billingCycle,
                status: subscription.status,
                currentPeriodStart,
                currentPeriodEnd,
                cancelAtPeriodEnd: subscriptionAny.cancel_at_period_end || false,
                updatedAt: new Date().toISOString(),
              })
              .select()
              .single();
            dbSubscription = data;
          }

          // If Insider tier, send to C+W for magazine fulfillment
          if (tier === 'insider') {
            await sendToCWFulfillment(subscription, customer);

            // Create magazine subscription record
            const shippingAddress = JSON.parse(JSON.stringify(
              customer.shipping || customer.address || {}
            ));
            await supabase
              .from('magazine_subscriptions')
              .insert({
                id: randomUUID(),
                subscriptionId: dbSubscription.id,
                shippingAddress,
                status: 'active',
                updatedAt: new Date().toISOString(),
              });
          }

          // Send welcome email
          await sendWelcomeEmail(customer.email!, tier, billingCycle);

          // Log activity
          if (userId && userId !== 'guest') {
            await supabase
              .from('activity_logs')
              .insert({
                id: randomUUID(),
                userId,
                action: 'SUBSCRIPTION_CREATED',
                entity: 'subscription',
                details: `SUCCESS+ ${tier} - ${billingCycle}`,
                ipAddress: '',
              });
          }

          log.info('Subscription created', { subscriptionId: subscription.id });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const supabase = supabaseAdmin();
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionAny = subscription as any;

        const currentPeriodStart = subscriptionAny.current_period_start
          ? new Date(subscriptionAny.current_period_start * 1000).toISOString()
          : undefined;
        const currentPeriodEnd = subscriptionAny.current_period_end
          ? new Date(subscriptionAny.current_period_end * 1000).toISOString()
          : undefined;

        // Update subscription in database
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: subscriptionAny.cancel_at_period_end || false,
          })
          .eq('stripeSubscriptionId', subscription.id);

        // Check if tier changed
        const { data: dbSub } = await supabase
          .from('subscriptions')
          .select(`
            *,
            magazine_subscriptions(*)
          `)
          .eq('stripeSubscriptionId', subscription.id)
          .single();

        if (dbSub) {
          const newTier = subscription.metadata?.tier as string | undefined;

          // If upgraded to Insider and no magazine subscription exists, create one
          if (newTier === 'insider' && !dbSub.magazine_subscriptions) {
            const customer = await stripe.customers.retrieve(
              subscription.customer as string
            ) as Stripe.Customer;

            await sendToCWFulfillment(subscription, customer);

            const shippingAddress = JSON.parse(JSON.stringify(
              customer.shipping || customer.address || {}
            ));
            await supabase
              .from('magazine_subscriptions')
              .insert({
                id: randomUUID(),
                subscriptionId: dbSub.id,
                shippingAddress,
                status: 'active',
                updatedAt: new Date().toISOString(),
              });
          }

          // If downgraded from Insider to Collective, cancel magazine
          if (newTier === 'collective' && dbSub.tier === 'insider' && dbSub.magazine_subscriptions) {
            await supabase
              .from('magazine_subscriptions')
              .update({ status: 'canceled' })
              .eq('subscriptionId', dbSub.id);

            // TODO: Send cancellation to C+W
          }

          // Update tier in database
          if (newTier !== dbSub.tier) {
            await supabase
              .from('subscriptions')
              .update({ tier: newTier })
              .eq('id', dbSub.id);
          }
        }

        log.info('Subscription updated', { subscriptionId: subscription.id });
        break;
      }

      case 'customer.subscription.deleted': {
        const supabase = supabaseAdmin();
        const subscription = event.data.object as Stripe.Subscription;

        // Update subscription status to canceled
        const { data: dbSub } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
          })
          .eq('stripeSubscriptionId', subscription.id)
          .select(`
            *,
            magazine_subscriptions(*)
          `)
          .single();

        // Cancel magazine subscription if exists
        if (dbSub?.magazine_subscriptions) {
          await supabase
            .from('magazine_subscriptions')
            .update({ status: 'canceled' })
            .eq('subscriptionId', dbSub.id);

          // TODO: Send cancellation to C+W
        }

        log.info('Subscription canceled', { subscriptionId: subscription.id });
        break;
      }

      case 'invoice.payment_succeeded': {
        const supabase = supabaseAdmin();
        const invoice = event.data.object as any;

        if (invoice.subscription) {
          // Log successful recurring payment
          const { data: dbSub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('stripeSubscriptionId', invoice.subscription as string)
            .single();

          if (dbSub?.memberId) {
            // Find user linked to this member
            const { data: linkedUsers } = await supabase
              .from('users')
              .select('*')
              .eq('memberId', dbSub.memberId)
              .limit(1);

            const linkedUser = linkedUsers && linkedUsers.length > 0 ? linkedUsers[0] : null;
            if (linkedUser) {
              await supabase
                .from('activity_logs')
                .insert({
                  id: randomUUID(),
                  userId: linkedUser.id,
                  action: 'SUBSCRIPTION_PAYMENT_SUCCEEDED',
                  entity: 'subscription',
                  details: `Amount: $${(invoice.amount_paid / 100).toFixed(2)}`,
                  ipAddress: '',
                });
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const supabase = supabaseAdmin();
        const invoice = event.data.object as any;

        if (invoice.subscription) {
          // Log failed payment
          const { data: dbSub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('stripeSubscriptionId', invoice.subscription as string)
            .single();

          if (dbSub?.memberId) {
            // Find user linked to this member
            const { data: linkedUsers } = await supabase
              .from('users')
              .select('*')
              .eq('memberId', dbSub.memberId)
              .limit(1);

            const linkedUser = linkedUsers && linkedUsers.length > 0 ? linkedUsers[0] : null;
            if (linkedUser) {
              await supabase
                .from('activity_logs')
                .insert({
                  id: randomUUID(),
                  userId: linkedUser.id,
                  action: 'SUBSCRIPTION_PAYMENT_FAILED',
                  entity: 'subscription',
                  details: `Amount: $${(invoice.amount_due / 100).toFixed(2)}`,
                  ipAddress: '',
                });
            }
          }

          // TODO: Send payment failed email to customer
        }
        break;
      }

      default:
        log.debug('Unhandled event type', { eventType: event.type });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    log.error('Webhook processing error', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
