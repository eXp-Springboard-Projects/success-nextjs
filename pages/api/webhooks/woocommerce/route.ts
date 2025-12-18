import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import crypto from 'crypto';

/**
 * WooCommerce Webhook Handler
 * Handles: order.created, order.updated, order.completed
 *
 * Setup in WooCommerce:
 * 1. Go to WooCommerce → Settings → Advanced → Webhooks
 * 2. Add webhook for each event type
 * 3. Delivery URL: https://yourdomain.com/api/webhooks/woocommerce/route
 * 4. Secret: Set WOOCOMMERCE_WEBHOOK_SECRET in .env.local
 * 5. API Version: WP REST API Integration v3
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature
    const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-wc-webhook-signature'] as string;
      const payload = JSON.stringify(req.body);

      if (!signature) {
        return res.status(401).json({ error: 'Missing signature' });
      }

      // WooCommerce uses HMAC-SHA256
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('base64');

      if (signature !== expectedSignature) {
        console.error('Signature mismatch:', { received: signature, expected: expectedSignature });
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const order = req.body;
    const wcOrderId = order.id?.toString();

    if (!wcOrderId) {
      return res.status(400).json({ error: 'Missing order ID' });
    }

    // Extract customer information
    const customerEmail = order.billing?.email || order.customer_email;
    const customerFirstName = order.billing?.first_name || '';
    const customerLastName = order.billing?.last_name || '';
    const customerName = `${customerFirstName} ${customerLastName}`.trim() || 'Guest';

    if (!customerEmail) {
      return res.status(400).json({ error: 'Missing customer email' });
    }

    // Find or create member
    let member = await prisma.members.findUnique({
      where: { email: customerEmail },
    });

    if (!member) {
      member = await prisma.members.create({
        data: {
          id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: customerEmail,
          firstName: customerFirstName || null,
          lastName: customerLastName || null,
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
      });
    }

    // Extract line items
    const lineItems = order.line_items || [];

    // Check if order already exists
    const existingOrder = await prisma.orders.findFirst({
      where: { woocommerceOrderId: wcOrderId },
    });

    const orderData = {
      orderNumber: `WC-${wcOrderId}`,
      memberId: member.id,
      userName: customerName,
      userEmail: customerEmail,
      total: parseFloat(order.total || '0'),
      subtotal: parseFloat(order.subtotal || '0'),
      tax: parseFloat(order.total_tax || '0'),
      shipping: parseFloat(order.shipping_total || '0'),
      discount: parseFloat(order.discount_total || '0'),
      status: mapWooCommerceStatus(order.status),
      paymentMethod: order.payment_method_title || order.payment_method || 'Unknown',
      paymentId: order.transaction_id || null,
      shippingAddress: JSON.stringify(order.shipping || {}),
      billingAddress: JSON.stringify(order.billing || {}),
      notes: order.customer_note || null,
      orderSource: 'WooCommerce',
      woocommerceOrderId: wcOrderId,
      fulfillmentStatus: order.status === 'completed' ? 'FULFILLED' : 'UNFULFILLED',
      updatedAt: new Date(),
    };

    let savedOrder;

    if (existingOrder) {
      // Update existing order
      savedOrder = await prisma.orders.update({
        where: { id: existingOrder.id },
        data: orderData,
      });
    } else {
      // Create new order
      savedOrder = await prisma.orders.create({
        data: {
          id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...orderData,
          createdAt: new Date(order.date_created || Date.now()),
        },
      });

      // Create order items
      for (const item of lineItems) {
        // Find or create product
        let product = await prisma.products.findFirst({
          where: {
            OR: [
              { name: item.name },
              { sku: item.sku }
            ]
          },
        });

        if (!product) {
          product = await prisma.products.create({
            data: {
              id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: item.name,
              slug: item.name.toLowerCase().replace(/\s+/g, '-'),
              description: '',
              price: parseFloat(item.price || '0'),
              sku: item.sku || null,
              stockQuantity: 0,
              status: 'ACTIVE',
            },
          });
        }

        // Create order item
        await prisma.order_items.create({
          data: {
            id: `oi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            orderId: savedOrder.id,
            productId: product.id,
            productName: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price || '0'),
            total: parseFloat(item.total || '0'),
          },
        });
      }

      // Create transaction record
      await prisma.transactions.create({
        data: {
          id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          memberId: member.id,
          type: 'PURCHASE',
          amount: parseFloat(order.total || '0'),
          status: order.status === 'completed' ? 'COMPLETED' : 'PENDING',
          description: `WooCommerce Order #${wcOrderId}`,
          metadata: JSON.stringify({ woocommerceOrderId: wcOrderId }),
        },
      });

      // Update member lifetime value
      const currentLifetimeValue = parseFloat(member.lifetimeValue?.toString() || '0');
      await prisma.members.update({
        where: { id: member.id },
        data: {
          lifetimeValue: currentLifetimeValue + parseFloat(order.total || '0'),
        },
      });
    }

return res.status(200).json({ received: true, orderId: savedOrder.id });
  } catch (error: any) {
    console.error('WooCommerce webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Map WooCommerce order status to our OrderStatus enum
 */
function mapWooCommerceStatus(wcStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'PENDING',
    'processing': 'PROCESSING',
    'on-hold': 'PENDING',
    'completed': 'COMPLETED',
    'cancelled': 'CANCELLED',
    'refunded': 'REFUNDED',
    'failed': 'FAILED',
  };

  return statusMap[wcStatus] || 'PENDING';
}
