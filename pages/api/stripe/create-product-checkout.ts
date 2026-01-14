import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { nanoid } from 'nanoid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const { items } = req.body; // Array of { productId, quantity }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    // Fetch product details from database
    const supabase = supabaseAdmin();
    const productIds = items.map((item: any) => item.productId);

    const { data: products, error } = await supabase
      .from('store_products')
      .select('*')
      .in('id', productIds)
      .eq('is_active', true);

    if (error || !products || products.length === 0) {
      return res.status(404).json({ error: 'Products not found' });
    }

    // Create line items for Stripe
    const lineItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);

      const price = product.sale_price || product.price;

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description || undefined,
            images: product.image ? [product.image] : undefined,
            metadata: {
              product_id: product.id,
              category: product.category,
              product_type: product.product_type || 'product',
            },
          },
          unit_amount: Math.round(parseFloat(price) * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: session?.user?.email || undefined,
      success_url: `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/store/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/store/checkout/cancel`,
      metadata: {
        userId: session?.user?.id || 'guest',
        orderType: 'store_purchase',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
    });

    // Create order record in database
    const orderId = nanoid();
    const subtotal = products.reduce((sum, p) => {
      const item = items.find((i: any) => i.productId === p.id);
      const price = parseFloat(p.sale_price || p.price);
      return sum + price * (item?.quantity || 0);
    }, 0);

    const orderData = {
      id: orderId,
      user_id: session?.user?.id || null,
      email: session?.user?.email || 'guest',
      status: 'PENDING',
      subtotal,
      tax: 0,
      shipping: 0,
      total: subtotal,
      stripe_session_id: checkoutSession.id,
      stripe_payment_intent: checkoutSession.payment_intent as string,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await supabase.from('orders').insert(orderData);

    // Create order items
    const orderItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId);
      const price = parseFloat(product.sale_price || product.price);

      return {
        id: nanoid(),
        order_id: orderId,
        product_id: item.productId,
        product_name: product.name,
        product_category: product.category,
        product_type: product.product_type || 'product',
        quantity: item.quantity,
        price,
        total: price * item.quantity,
        created_at: new Date().toISOString(),
      };
    });

    await supabase.from('order_items').insert(orderItems);

    return res.status(200).json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating product checkout:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
