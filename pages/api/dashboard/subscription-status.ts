import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get user with member and subscription data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        member:members (
          membershipTier,
          subscriptions (
            tier,
            status,
            currentPeriodEnd,
            currentPeriodStart,
            cancelAtPeriodEnd,
            provider,
            billingCycle,
            stripeCustomerId,
            createdAt
          )
        )
      `)
      .eq('email', session.user.email!)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get active subscriptions and sort by createdAt
    const activeSubscriptions = (user as any).member?.subscriptions
      ?.filter((s: any) => s.status === 'ACTIVE')
      ?.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

    const activeSubscription = activeSubscriptions[0];

    if (!activeSubscription) {
      return res.status(200).json({
        status: 'inactive',
        membershipTier: (user as any).member?.membershipTier || 'Free',
      });
    }

    // Get payment method info from Stripe if available
    let paymentMethod = null;
    if (activeSubscription.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const customer = await stripe.customers.retrieve(activeSubscription.stripeCustomerId);

        if (customer && !customer.deleted && customer.invoice_settings?.default_payment_method) {
          const pm = await stripe.paymentMethods.retrieve(
            customer.invoice_settings.default_payment_method
          );

          if (pm.card) {
            paymentMethod = {
              last4: pm.card.last4,
              brand: pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1),
            };
          }
        }
      } catch (stripeError) {
        // Continue without payment method info
      }
    }

    return res.status(200).json({
      tier: activeSubscription.tier || 'SUCCESS+ Insider',
      status: activeSubscription.status,
      currentPeriodEnd: activeSubscription.currentPeriodEnd,
      currentPeriodStart: activeSubscription.currentPeriodStart,
      cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
      provider: activeSubscription.provider,
      billingCycle: activeSubscription.billingCycle,
      stripeCustomerId: activeSubscription.stripeCustomerId,
      membershipTier: (user as any).member?.membershipTier || 'Free',
      paymentMethod,
    });
  } catch (error) {
    console.error('Dashboard subscription status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
