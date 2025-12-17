import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

// SUCCESS+ Pricing Configuration
const PRICING = {
  collective: {
    monthly: { priceId: 'price_collective_monthly', amount: 2499 }, // $24.99
    annual: { priceId: 'price_collective_annual', amount: 20900 },  // $209
  },
  insider: {
    monthly: { priceId: 'price_insider_monthly', amount: 6499 },    // $64.99
    annual: { priceId: 'price_insider_annual', amount: 54500 },     // $545
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const { tier, billingCycle, successUrl, cancelUrl } = req.body;

    // Validate inputs
    if (!tier || !billingCycle || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['collective', 'insider'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    if (!['monthly', 'annual'].includes(billingCycle)) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }

    // Get pricing info
    const pricing = PRICING[tier as 'collective' | 'insider'][billingCycle as 'monthly' | 'annual'];

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: session?.user?.email || undefined,
      client_reference_id: session?.user?.id || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `SUCCESS+ ${tier === 'collective' ? 'Collective' : 'Insider'}`,
              description: tier === 'collective'
                ? '100+ training courses, digital magazine, mobile app access'
                : 'Everything in Collective plus print magazine, exclusive content, live Q&A, coaching',
              images: ['https://www.success.com/wp-content/uploads/2023/success-logo.png'],
            },
            recurring: {
              interval: billingCycle === 'monthly' ? 'month' : 'year',
            },
            unit_amount: pricing.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        tier,
        billingCycle,
        userId: session?.user?.id || 'guest',
      },
      subscription_data: {
        metadata: {
          tier,
          billingCycle,
          userId: session?.user?.id || 'guest',
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return res.status(200).json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
