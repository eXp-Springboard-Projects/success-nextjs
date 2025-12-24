import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '../../../lib/stripe';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    const { paylinkId, customerName, customerEmail, shippingAddress } = req.body;

    if (!paylinkId || !customerName || !customerEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get paylink
    const { data: paylink, error: paylinkError } = await supabase
      .from('pay_links')
      .select('*')
      .eq('id', paylinkId)
      .single();

    if (paylinkError) {
      throw paylinkError;
    }

    if (!paylink) {
      return res.status(404).json({ error: 'Payment link not found' });
    }

    // Validate paylink is active and available
    if (paylink.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Payment link is not active' });
    }

    if (paylink.expiresAt && new Date(paylink.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Payment link has expired' });
    }

    if (paylink.maxUses && paylink.currentUses >= paylink.maxUses) {
      return res.status(400).json({ error: 'Payment link has reached maximum uses' });
    }

    // Check if Stripe is configured
    if (!stripe) {
      return res.status(500).json({ error: 'Payment processing is not configured' });
    }

    // Create or get Stripe customer
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        metadata: {
          paylink_id: paylinkId,
          paylink_slug: paylink.slug,
        },
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: paylink.stripePriceId || undefined,
          quantity: 1,
          ...((!paylink.stripePriceId) && {
            price_data: {
              currency: paylink.currency.toLowerCase(),
              unit_amount: Math.round(Number(paylink.amount) * 100),
              product_data: {
                name: paylink.title,
                description: paylink.description || undefined,
              },
            },
          }),
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pay/${paylink.slug}`,
      metadata: {
        paylink_id: paylinkId,
        paylink_slug: paylink.slug,
        paylink_title: paylink.title,
      },
      ...(shippingAddress && {
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU'],
        },
      }),
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}
