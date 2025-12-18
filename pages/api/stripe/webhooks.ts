import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const prisma = new PrismaClient();

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
  const cwWebhookUrl = process.env.CW_WEBHOOK_URL;
  const cwWebhookSecret = process.env.CW_WEBHOOK_SECRET;

  if (!cwWebhookUrl) {
    console.warn('CW_WEBHOOK_URL not configured, skipping magazine fulfillment');
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

    const result = await response.json();
    console.log('Magazine fulfillment sent to C+W:', result);
  } catch (error) {
    console.error('Failed to send to C+W fulfillment:', error);
    // Log to database for manual retry
    await prisma.activity_logs.create({
      data: {
        id: randomUUID(),
        userId: subscription.metadata.userId || 'system',
        action: 'CW_FULFILLMENT_FAILED',
        entity: 'subscription',
        details: JSON.stringify({
          subscriptionId: subscription.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        ipAddress: '',
      },
    });
  }
}

/**
 * Send welcome email to new subscriber
 */
async function sendWelcomeEmail(email: string, tier: string, billingCycle: string) {
  // TODO: Implement email sending with SendGrid/Resend
  console.log(`TODO: Send welcome email to ${email} for ${tier} ${billingCycle}`);
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
    console.error('Webhook signature verification failed:', err);
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

          const tier = session.metadata?.tier || 'collective';
          const billingCycle = session.metadata?.billingCycle || 'monthly';
          const userId = session.metadata?.userId;

          // Find or create member for subscription
          let member = await prisma.members.findFirst({
            where: { stripeCustomerId: customer.id },
          });
          if (!member && customer.email) {
            member = await prisma.members.findFirst({
              where: { email: customer.email },
            });
          }
          if (!member && customer.email) {
            member = await prisma.members.create({
              data: {
                id: randomUUID(),
                email: customer.email,
                firstName: customer.name?.split(' ')[0] || customer.email.split('@')[0],
                lastName: customer.name?.split(' ').slice(1).join(' ') || '',
                stripeCustomerId: customer.id,
                membershipTier: 'Customer',
                membershipStatus: 'Active',
                totalSpent: 0,
                lifetimeValue: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          }

          // Create or update subscription in database
          const subscriptionAny = subscription as any;
          const currentPeriodStart = subscriptionAny.current_period_start
            ? new Date(subscriptionAny.current_period_start * 1000)
            : new Date();
          const currentPeriodEnd = subscriptionAny.current_period_end
            ? new Date(subscriptionAny.current_period_end * 1000)
            : new Date();

          const dbSubscription = await prisma.subscriptions.upsert({
            where: {
              stripeSubscriptionId: subscription.id,
            },
            update: {
              status: subscription.status,
              currentPeriodStart,
              currentPeriodEnd,
              cancelAtPeriodEnd: subscriptionAny.cancel_at_period_end || false,
            },
            create: {
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
              updatedAt: new Date(),
            },
          });

          // If Insider tier, send to C+W for magazine fulfillment
          if (tier === 'insider') {
            await sendToCWFulfillment(subscription, customer);

            // Create magazine subscription record
            const shippingAddress = JSON.parse(JSON.stringify(
              customer.shipping || customer.address || {}
            ));
            await prisma.magazine_subscriptions.create({
              data: {
                id: randomUUID(),
                subscriptionId: dbSubscription.id,
                shippingAddress,
                status: 'active',
                updatedAt: new Date(),
              },
            });
          }

          // Send welcome email
          await sendWelcomeEmail(customer.email!, tier, billingCycle);

          // Log activity
          if (userId && userId !== 'guest') {
            await prisma.activity_logs.create({
              data: {
                id: randomUUID(),
                userId,
                action: 'SUBSCRIPTION_CREATED',
                entity: 'subscription',
                details: `SUCCESS+ ${tier} - ${billingCycle}`,
                ipAddress: '',
              },
            });
          }

          console.log('Subscription created:', subscription.id);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionAny = subscription as any;

        const currentPeriodStart = subscriptionAny.current_period_start
          ? new Date(subscriptionAny.current_period_start * 1000)
          : undefined;
        const currentPeriodEnd = subscriptionAny.current_period_end
          ? new Date(subscriptionAny.current_period_end * 1000)
          : undefined;

        // Update subscription in database
        await prisma.subscriptions.update({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: {
            status: subscription.status,
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: subscriptionAny.cancel_at_period_end || false,
          },
        });

        // Check if tier changed
        const dbSub = await prisma.subscriptions.findUnique({
          where: { stripeSubscriptionId: subscription.id },
          include: { magazine_subscriptions: true },
        });

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
            await prisma.magazine_subscriptions.create({
              data: {
                id: randomUUID(),
                subscriptionId: dbSub.id,
                shippingAddress,
                status: 'active',
                updatedAt: new Date(),
              },
            });
          }

          // If downgraded from Insider to Collective, cancel magazine
          if (newTier === 'collective' && dbSub.tier === 'insider' && dbSub.magazine_subscriptions) {
            await prisma.magazine_subscriptions.update({
              where: { subscriptionId: dbSub.id },
              data: { status: 'canceled' },
            });

            // TODO: Send cancellation to C+W
          }

          // Update tier in database
          if (newTier !== dbSub.tier) {
            await prisma.subscriptions.update({
              where: { id: dbSub.id },
              data: { tier: newTier },
            });
          }
        }

        console.log('Subscription updated:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Update subscription status to canceled
        const dbSub = await prisma.subscriptions.update({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: {
            status: 'canceled',
          },
          include: {
            magazine_subscriptions: true,
          },
        });

        // Cancel magazine subscription if exists
        if (dbSub.magazine_subscriptions) {
          await prisma.magazine_subscriptions.update({
            where: { subscriptionId: dbSub.id },
            data: { status: 'canceled' },
          });

          // TODO: Send cancellation to C+W
        }

        console.log('Subscription canceled:', subscription.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;

        if (invoice.subscription) {
          // Log successful recurring payment
          const dbSub = await prisma.subscriptions.findUnique({
            where: { stripeSubscriptionId: invoice.subscription as string },
          });

          if (dbSub?.memberId) {
            // Find user linked to this member
            const linkedUser = await prisma.users.findFirst({
              where: { memberId: dbSub.memberId },
            });
            if (linkedUser) {
              await prisma.activity_logs.create({
                data: {
                  id: randomUUID(),
                  userId: linkedUser.id,
                  action: 'SUBSCRIPTION_PAYMENT_SUCCEEDED',
                  entity: 'subscription',
                  details: `Amount: $${(invoice.amount_paid / 100).toFixed(2)}`,
                  ipAddress: '',
                },
              });
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;

        if (invoice.subscription) {
          // Log failed payment
          const dbSub = await prisma.subscriptions.findUnique({
            where: { stripeSubscriptionId: invoice.subscription as string },
          });

          if (dbSub?.memberId) {
            // Find user linked to this member
            const linkedUser = await prisma.users.findFirst({
              where: { memberId: dbSub.memberId },
            });
            if (linkedUser) {
              await prisma.activity_logs.create({
                data: {
                  id: randomUUID(),
                  userId: linkedUser.id,
                  action: 'SUBSCRIPTION_PAYMENT_FAILED',
                  entity: 'subscription',
                  details: `Amount: $${(invoice.amount_due / 100).toFixed(2)}`,
                  ipAddress: '',
                },
              });
            }
          }

          // TODO: Send payment failed email to customer
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
