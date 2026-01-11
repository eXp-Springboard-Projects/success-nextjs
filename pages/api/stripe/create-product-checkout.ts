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
      .from('products')
      .select('*')
      .in('id', productIds);

    if (error || !products || products.length === 0) {
      return res.status(404).json({ error: 'Products not found' });
    }

    // Create line items for Stripe
    const lineItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);

      const price = product.salePrice || product.price;

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.title,
            description: product.description || undefined,
            images: product.thumbnail ? [product.thumbnail] : undefined,
          },
          unit_amount: Math.round(price * 100), // Convert to cents
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
      success_url: `${process.env.NEXTAUTH_URL}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/shop/cart`,
      metadata: {
        userId: session?.user?.id || 'guest',
        orderType: 'product_purchase',
      },
    });

    // Create order record in database
    const orderId = nanoid();
    const subtotal = products.reduce((sum, p) => {
      const item = items.find((i: any) => i.productId === p.id);
      const price = p.salePrice || p.price;
      return sum + price * (item?.quantity || 0);
    }, 0);

    await supabase.from('orders').insert({
      id: orderId,
      userId: session?.user?.id || null,
      email: session?.user?.email || 'guest',
      status: 'pending',
      subtotal,
      tax: 0,
      shipping: 0,
      total: subtotal,
      stripePaymentIntentId: checkoutSession.payment_intent as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create order items
    const orderItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId);
      const price = product.salePrice || product.price;

      return {
        id: nanoid(),
        orderId,
        productId: item.productId,
        productSnapshot: product,
        quantity: item.quantity,
        price,
        total: price * item.quantity,
        createdAt: new Date().toISOString(),
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
