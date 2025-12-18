import Stripe from 'stripe';

// Initialize Stripe with secret key
// This should only be used on the server side
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null;

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(user) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Check if user already has a Stripe customer ID
  if (user.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      return customer;
    } catch (error) {
      console.error('Error retrieving Stripe customer:', error);
      // Customer doesn't exist, create new one
    }
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: user.id,
    },
  });

  return customer;
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata = {},
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  });

  return session;
}

/**
 * Create a portal session for managing subscription
 */
export async function createPortalSession({ customerId, returnUrl }) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get subscription status
 */
export async function getSubscriptionStatus(subscriptionId) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: cancelAtPeriodEnd,
  });

  return subscription;
}

/**
 * Product/Price IDs (configure these in Stripe dashboard)
 */
export const STRIPE_PRODUCTS = {
  MONTHLY: {
    name: 'SUCCESS+ Monthly',
    priceId: process.env.STRIPE_PRICE_MONTHLY || 'price_...',
    amount: 9.99,
    interval: 'month',
  },
  ANNUAL: {
    name: 'SUCCESS+ Annual',
    priceId: process.env.STRIPE_PRICE_ANNUAL || 'price_...',
    amount: 99.99,
    interval: 'year',
  },
  MAGAZINE_ONLY: {
    name: 'Magazine Subscription',
    priceId: process.env.STRIPE_PRICE_MAGAZINE || 'price_...',
    amount: 19.99,
    interval: 'year',
  },
};
