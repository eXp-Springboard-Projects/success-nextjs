import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
});

// SUCCESS+ Price IDs (you'll need to create these in Stripe Dashboard)
export const STRIPE_PRICES = {
  SUCCESS_PLUS_MONTHLY: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder',
  SUCCESS_PLUS_YEARLY: process.env.STRIPE_PRICE_YEARLY || 'price_yearly_placeholder',
};

// Product metadata
export const PRODUCT_INFO = {
  SUCCESS_PLUS_MONTHLY: {
    name: 'SUCCESS+ Monthly',
    price: 7.99,
    interval: 'month' as const,
    description: 'Full access to SUCCESS+ premium content, tools, and resources',
  },
  SUCCESS_PLUS_YEARLY: {
    name: 'SUCCESS+ Annual',
    price: 79.99,
    interval: 'year' as const,
    description: 'Full access to SUCCESS+ premium content, tools, and resources',
    savings: '$15.89/year compared to monthly',
  },
};

/**
 * Create or retrieve a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(email: string, name?: string): Promise<string> {
  // Check if customer already exists
  const existingCustomers = await stripe.customers.list({
    email: email.toLowerCase(),
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email: email.toLowerCase(),
    name: name || undefined,
    metadata: {
      source: 'success-nextjs',
    },
  });

  return customer.id;
}

/**
 * Create a checkout session for SUCCESS+ subscription
 */
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  customerEmail,
  trialPeriodDays,
}: {
  customerId?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  trialPeriodDays?: number;
}) {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
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
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    subscription_data: {
      metadata: {
        product: 'SUCCESS+',
      },
    },
  };

  // Add customer ID or email
  if (customerId) {
    sessionParams.customer = customerId;
  } else if (customerEmail) {
    sessionParams.customer_email = customerEmail.toLowerCase();
  }

  // Add trial period if converting from free trial
  if (trialPeriodDays && trialPeriodDays > 0) {
    sessionParams.subscription_data!.trial_period_days = trialPeriodDays;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return session;
}

/**
 * Create a customer portal session for managing billing
 */
export async function createPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return subscription;
}

/**
 * Reactivate a subscription that was set to cancel
 */
export async function reactivateSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return subscription;
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}
