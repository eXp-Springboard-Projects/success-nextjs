import { buffer } from 'micro';
import { stripe } from '../../../lib/stripe';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../../../lib/logger';

const log = createLogger('StripeWebhook');
const prisma = new PrismaClient();

// Disable body parsing, need raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  if (!stripe) {
    log.error('Stripe is not configured');
    return res.status(500).json({ message: 'Stripe not configured' });
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    log.error('Webhook signature verification failed', err);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        log.debug('Unhandled event type', { eventType: event.type });
    }

    res.json({ received: true });
  } catch (error) {
    log.error('Error handling webhook', error);
    res.status(500).json({ message: 'Webhook handler failed' });
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription) {
  const customerId = subscription.customer;

  // Get customer details from Stripe
  const customer = await stripe.customers.retrieve(customerId);

  // Check if Member exists by Stripe customer ID or email
  let member = await prisma.members.findFirst({
    where: {
      OR: [
        { stripeCustomerId: customerId },
        { email: customer.email },
      ],
    },
  });

  if (!member) {
    // Create new Member (this is a new customer)

    const name = customer.name || customer.email.split('@')[0];
    const nameParts = name.split(' ');

    member = await prisma.members.create({
      data: {
        firstName: nameParts[0] || name,
        lastName: nameParts.slice(1).join(' ') || '',
        email: customer.email,
        phone: customer.phone || null,
        stripeCustomerId: customerId,
        membershipTier: 'SUCCESSPlus',
        membershipStatus: 'Active',
      },
    });
  } else {
    // Update existing member
    await prisma.members.update({
      where: { id: member.id },
      data: {
        stripeCustomerId: customerId,
        membershipTier: 'SUCCESSPlus',
        membershipStatus: 'Active',
      },
    });
  }

  // Create or update subscription record
  await prisma.subscriptions.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      memberId: member.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      status: subscription.status.toUpperCase(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      provider: 'stripe',
    },
    update: {
      stripePriceId: subscription.items.data[0].price.id,
      status: subscription.status.toUpperCase(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // Check if this member is also a platform user
  const platformUser = await prisma.users.findUnique({
    where: { email: member.email },
  });

  if (platformUser && !platformUser.memberId) {
    // Link platform user to member
    await prisma.users.update({
      where: { id: platformUser.id },
      data: { memberId: member.id },
    });
    log.info('Linked platform user to member', { email: platformUser.email });
  }

  log.info('Subscription created for member', { memberId: member.id });
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;

  const member = await prisma.members.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!member) {
    log.error('Member not found for customer', { customerId });
    return;
  }

  // Update subscription
  await prisma.subscriptions.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status.toUpperCase(),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // Update member tier based on subscription status
  const newTier = subscription.status === 'active' ? 'SUCCESSPlus' : 'Customer';
  await prisma.members.update({
    where: { id: member.id },
    data: {
      membershipTier: newTier,
      membershipStatus: subscription.status === 'active' ? 'Active' : 'Inactive',
    },
  });

  log.info('Subscription updated', { memberId: member.id });
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  const member = await prisma.members.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!member) {
    log.error('Member not found for customer', { customerId });
    return;
  }

  await prisma.subscriptions.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED',
      cancelAtPeriodEnd: false,
    },
  });

  // Downgrade member tier
  await prisma.members.update({
    where: { id: member.id },
    data: {
      membershipTier: 'Customer',
      membershipStatus: 'Cancelled',
    },
  });

  log.info('Subscription deleted', { memberId: member.id });
}

// Handle successful payment
async function handlePaymentSucceeded(invoice) {
  const customerId = invoice.customer;

  const member = await prisma.members.findFirst({
    where: { stripeCustomerId: customerId },
    include: { subscriptions: true },
  });

  if (!member) {
    log.error('Member not found for customer', { customerId });
    return;
  }

  // Create transaction record
  const amount = invoice.amount_paid / 100;
  await prisma.transactions.create({
    data: {
      memberId: member.id,
      amount: amount,
      currency: invoice.currency.toUpperCase(),
      status: 'succeeded',
      type: 'subscription',
      description: invoice.description || 'SUCCESS+ Subscription Payment',
      paymentMethod: invoice.payment_method_types?.[0] || 'card',
      provider: 'stripe',
      providerTxnId: invoice.id,
      metadata: {
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription,
      },
    },
  });

  // Update member's total spent and lifetime value
  await prisma.members.update({
    where: { id: member.id },
    data: {
      totalSpent: { increment: amount },
      lifetimeValue: { increment: amount },
    },
  });

  // Send confirmation email
  const { sendEmail, getSubscriptionConfirmationHTML } = require('../../../lib/email');
  const fullName = `${member.firstName} ${member.lastName}`.trim();
  const plan = member.subscriptions?.[0]?.stripePriceId || 'SUCCESS+';

  await sendEmail({
    to: member.email,
    subject: 'Payment Successful - SUCCESS+ Subscription',
    html: getSubscriptionConfirmationHTML(fullName || 'Subscriber', plan, amount.toFixed(2)),
  });

  log.info('Payment succeeded', { memberId: member.id });
}

// Handle failed payment
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;

  const member = await prisma.members.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!member) {
    log.error('Member not found for customer', { customerId });
    return;
  }

  await prisma.subscriptions.update({
    where: { stripeSubscriptionId: invoice.subscription },
    data: {
      status: 'PAST_DUE',
    },
  });

  // Update member status
  await prisma.members.update({
    where: { id: member.id },
    data: {
      membershipStatus: 'Inactive',
    },
  });

  // Create failed transaction record
  const amount = invoice.amount_due / 100;
  await prisma.transactions.create({
    data: {
      memberId: member.id,
      amount: amount,
      currency: invoice.currency.toUpperCase(),
      status: 'failed',
      type: 'subscription',
      description: 'Failed subscription payment',
      provider: 'stripe',
      providerTxnId: invoice.id,
    },
  });

  // Send payment failed email
  const { sendEmail, getPaymentFailedHTML } = require('../../../lib/email');
  const fullName = `${member.firstName} ${member.lastName}`.trim();

  await sendEmail({
    to: member.email,
    subject: 'Payment Failed - Action Required',
    html: getPaymentFailedHTML(fullName || 'Subscriber'),
  });

  log.info('Payment failed', { memberId: member.id });
}
