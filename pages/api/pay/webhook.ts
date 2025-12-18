import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import { stripe } from '../../../lib/stripe';
import { prisma } from '../../../lib/prisma';
import { randomUUID } from 'crypto';

// Disable body parsing, need raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'No signature' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'payment_intent.succeeded':
break;

      case 'payment_intent.payment_failed':
break;

      default:
}

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleCheckoutSessionCompleted(session: any) {
const paylinkId = session.metadata?.paylink_id;

  if (!paylinkId) {
    return;
  }

  try {
    // Increment currentUses for the paylink
    await prisma.pay_links.update({
      where: { id: paylinkId },
      data: {
        currentUses: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });

    // Create order record (optional - for tracking)
    const orderNumber = `PL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    await prisma.orders.create({
      data: {
        id: randomUUID(),
        orderNumber,
        userName: session.customer_details?.name || 'Guest',
        userEmail: session.customer_details?.email || '',
        total: session.amount_total / 100, // Convert from cents
        subtotal: session.amount_subtotal / 100,
        tax: ((session.amount_total - session.amount_subtotal) / 100),
        shipping: 0,
        discount: 0,
        status: 'COMPLETED',
        paymentMethod: 'stripe',
        paymentId: session.payment_intent,
        shippingAddress: session.shipping_details ? JSON.stringify(session.shipping_details) : null,
        billingAddress: session.customer_details?.address ? JSON.stringify(session.customer_details.address) : null,
        notes: `PayLink: ${session.metadata?.paylink_title || session.metadata?.paylink_slug}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

} catch (error) {
  }
}
