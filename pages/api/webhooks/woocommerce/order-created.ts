/**
 * WooCommerce Webhook: Order Created
 * Receives new orders from mysuccessplus.com/shop and syncs them to our admin
 *
 * WooCommerce Setup:
 * 1. Go to WooCommerce → Settings → Advanced → Webhooks
 * 2. Create webhook with:
 *    - Topic: Order created
 *    - Delivery URL: https://yourdomain.com/api/webhooks/woocommerce/order-created
 *    - Secret: [generate and save in .env.local as WOOCOMMERCE_WEBHOOK_SECRET]
 *    - API Version: WP REST API Integration v3
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabase';
import crypto from 'crypto';

const supabase = supabaseAdmin();

interface WooCommerceOrder {
  id: number;
  order_key: string;
  number: string;
  status: string;
  currency: string;
  total: string;
  subtotal: string;
  total_tax: string;
  shipping_total: string;
  discount_total: string;
  customer_id: number;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  date_created: string;
  date_modified: string;
  customer_note: string;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    quantity: number;
    subtotal: string;
    total: string;
    sku: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify WooCommerce webhook signature
    const signature = req.headers['x-wc-webhook-signature'] as string;
    const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('base64');

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const wooOrder: WooCommerceOrder = req.body;

    // Check if order already exists
    const { data: existingOrder, error: findOrderError } = await supabase
      .from('orders')
      .select('*')
      .eq('woocommerceOrderId', wooOrder.id)
      .single();

    if (existingOrder && !findOrderError) {
      return res.status(200).json({
        message: 'Order already synced',
        orderId: existingOrder.id
      });
    }

    // Find or create member
    const email = wooOrder.billing.email;
    const { data: member, error: findMemberError } = await supabase
      .from('members')
      .select('*')
      .eq('email', email)
      .single();

    let memberId;

    if (!member || findMemberError) {
      // Create new member from WooCommerce customer
      const { data: newMember, error: createMemberError } = await supabase
        .from('members')
        .insert({
          id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          firstName: wooOrder.billing.first_name,
          lastName: wooOrder.billing.last_name,
          email: wooOrder.billing.email,
          phone: wooOrder.billing.phone || null,
          membershipTier: 'Customer',
          membershipStatus: 'Active',
          joinDate: new Date(wooOrder.date_created).toISOString(),
          woocommerceCustomerId: wooOrder.customer_id || null,
          tags: ['WooCommerce'],
        })
        .select()
        .single();

      if (createMemberError) throw createMemberError;
      memberId = newMember.id;
    } else {
      memberId = member.id;
    }

    // Map WooCommerce status to our OrderStatus
    const statusMap: Record<string, string> = {
      'pending': 'PENDING',
      'processing': 'PROCESSING',
      'completed': 'COMPLETED',
      'on-hold': 'PENDING',
      'cancelled': 'CANCELED',
      'refunded': 'REFUNDED',
      'failed': 'FAILED',
    };

    const orderStatus = statusMap[wooOrder.status] || 'PENDING';

    // Create shipping address JSON
    const shippingAddress = JSON.stringify({
      firstName: wooOrder.shipping.first_name,
      lastName: wooOrder.shipping.last_name,
      address1: wooOrder.shipping.address_1,
      address2: wooOrder.shipping.address_2,
      city: wooOrder.shipping.city,
      state: wooOrder.shipping.state,
      postcode: wooOrder.shipping.postcode,
      country: wooOrder.shipping.country,
    });

    // Create billing address JSON
    const billingAddress = JSON.stringify({
      firstName: wooOrder.billing.first_name,
      lastName: wooOrder.billing.last_name,
      address1: wooOrder.billing.address_1,
      address2: wooOrder.billing.address_2,
      city: wooOrder.billing.city,
      state: wooOrder.billing.state,
      postcode: wooOrder.billing.postcode,
      country: wooOrder.billing.country,
    });

    // Create order in our database
    const { data: order, error: createOrderError } = await supabase
      .from('orders')
      .insert({
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderNumber: `WC-${wooOrder.number}`,
        memberId,
        userName: `${wooOrder.billing.first_name} ${wooOrder.billing.last_name}`,
        userEmail: wooOrder.billing.email,
        total: parseFloat(wooOrder.total),
        subtotal: parseFloat(wooOrder.subtotal || wooOrder.total),
        tax: parseFloat(wooOrder.total_tax || '0'),
        shipping: parseFloat(wooOrder.shipping_total || '0'),
        discount: parseFloat(wooOrder.discount_total || '0'),
        status: orderStatus as any,
        paymentMethod: wooOrder.payment_method_title || wooOrder.payment_method,
        paymentId: wooOrder.transaction_id || null,
        shippingAddress,
        billingAddress,
        notes: wooOrder.customer_note || null,
        customerNotes: wooOrder.customer_note || null,
        orderSource: 'WooCommerce',
        woocommerceOrderId: wooOrder.id,
        fulfillmentStatus: orderStatus === 'COMPLETED' ? 'FULFILLED' : 'UNFULFILLED',
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (createOrderError) throw createOrderError;

    // Create order items
    for (const item of wooOrder.line_items) {
      // Find or create product
      const { data: products, error: findProductError } = await supabase
        .from('products')
        .select('*')
        .or(`sku.eq.${item.sku},name.eq.${item.name}`)
        .limit(1);

      let productId;

      if (!products || products.length === 0 || findProductError) {
        // Create placeholder product
        const { data: newProduct, error: createProductError } = await supabase
          .from('products')
          .insert({
            id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: item.name,
            slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: `Product from WooCommerce (ID: ${item.product_id})`,
            price: parseFloat(item.total) / item.quantity,
            sku: item.sku || `wc-${item.product_id}`,
            status: 'ACTIVE',
            category: 'MERCHANDISE',
          })
          .select()
          .single();

        if (createProductError) throw createProductError;
        productId = newProduct.id;
      } else {
        productId = products[0].id;
      }

      await supabase
        .from('order_items')
        .insert({
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          orderId: order.id,
          productId,
          productName: item.name,
          quantity: item.quantity,
          price: parseFloat(item.subtotal) / item.quantity,
          total: parseFloat(item.total),
        });
    }

    // Update member's total spent
    const currentMember = member || (await supabase.from('members').select('*').eq('id', memberId).single()).data;
    const currentTotalSpent = parseFloat(currentMember?.totalSpent?.toString() || '0');
    const currentLifetimeValue = parseFloat(currentMember?.lifetimeValue?.toString() || '0');

    await supabase
      .from('members')
      .update({
        totalSpent: currentTotalSpent + parseFloat(wooOrder.total),
        lifetimeValue: currentLifetimeValue + parseFloat(wooOrder.total),
      })
      .eq('id', memberId);

    // Create transaction record
    await supabase
      .from('transactions')
      .insert({
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        memberId,
        amount: parseFloat(wooOrder.total),
        currency: wooOrder.currency,
        status: orderStatus === 'COMPLETED' ? 'succeeded' : 'pending',
        type: 'one-time',
        description: `WooCommerce Order #${wooOrder.number}`,
        paymentMethod: wooOrder.payment_method,
        provider: 'woocommerce',
        providerTxnId: wooOrder.transaction_id || wooOrder.order_key,
        metadata: {
          woocommerceOrderId: wooOrder.id,
          orderNumber: wooOrder.number,
        },
      });

return res.status(200).json({
      success: true,
      message: 'Order synced successfully',
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
