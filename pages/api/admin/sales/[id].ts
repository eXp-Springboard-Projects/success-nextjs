/**
 * API Endpoint: /api/admin/sales/[id]
 * Get detailed information about a specific transaction
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try to find as subscription first
    const subscription = await prisma.subscriptions.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            name: true,
            email: true,
            id: true,
          },
        },
        magazine_subscriptions: true,
      },
    });

    if (subscription) {
      const isMagazine = !!subscription.magazine_subscriptions;
      const amount = isMagazine ? 19.99 : 9.99; // TODO: Get actual price from tier

      return res.status(200).json({
        id: subscription.id,
        type: 'subscription',
        productName: isMagazine ? 'SUCCESS Magazine (Print)' : 'SUCCESS+ Digital',
        customerName: subscription.users?.name || 'Unknown',
        customerEmail: subscription.users?.email || 'Unknown',
        userId: subscription.userId,
        amount,
        status: subscription.status,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        provider: subscription.provider,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      });
    }

    // Try to find as order
    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        order_items: true,
      },
    });

    if (order) {
      return res.status(200).json({
        id: order.id,
        type: 'order',
        productName: `Order #${order.orderNumber}`,
        customerName: order.userName,
        customerEmail: order.userEmail,
        userId: order.userId,
        amount: parseFloat(order.total.toString()),
        status: order.status.toLowerCase(),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        orderNumber: order.orderNumber,
        subtotal: parseFloat(order.subtotal.toString()),
        tax: parseFloat(order.tax.toString()),
        shipping: parseFloat(order.shipping.toString()),
        discount: parseFloat(order.discount.toString()),
        paymentMethod: order.paymentMethod,
        paymentId: order.paymentId,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        items: order.order_items.map((item: any) => ({
          productName: item.productName,
          quantity: item.quantity,
          price: parseFloat(item.price.toString()),
        })),
      });
    }

    // Not found
    return res.status(404).json({ error: 'Transaction not found' });
  } catch (error: any) {
    console.error('Transaction detail API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
