/**
 * API: Mark order as fulfilled and sync with WooCommerce
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { prisma } from '../../../../../lib/prisma';
import woocommerce from '../../../../../lib/woocommerce';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid order ID' });
  }

  if (req.method === 'POST') {
    try {
      const {
        trackingNumber,
        trackingCarrier,
        trackingUrl,
        internalNotes,
        customerNotes,
      } = req.body;

      // Get order
      const order = await prisma.orders.findUnique({
        where: { id },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Update order in database
      const updatedOrder = await prisma.orders.update({
        where: { id },
        data: {
          fulfillmentStatus: 'FULFILLED',
          fulfilledAt: new Date(),
          fulfilledBy: session.user.id,
          trackingNumber: trackingNumber || null,
          trackingCarrier: trackingCarrier || null,
          trackingUrl: trackingUrl || null,
          internalNotes: internalNotes || order.internalNotes,
          customerNotes: customerNotes || order.customerNotes,
          status: 'COMPLETED',
          updatedAt: new Date(),
        },
      });

// If this is a WooCommerce order, sync back to WooCommerce
      if (order.woocommerceOrderId) {
        try {
          // Mark order as completed in WooCommerce
          await woocommerce.completeOrder(order.woocommerceOrderId);
// Add tracking info if provided
          if (trackingNumber && trackingCarrier) {
            await woocommerce.addTracking(order.woocommerceOrderId, {
              trackingNumber,
              trackingCarrier,
              trackingUrl: trackingUrl || undefined,
              dateShipped: new Date().toISOString(),
            });
}

          // Add customer note if provided
          if (customerNotes) {
            await woocommerce.addOrderNote(
              order.woocommerceOrderId,
              customerNotes,
              true // visible to customer
            );
          }

        } catch (wooError: any) {
          console.error('⚠️  Failed to sync with WooCommerce:', wooError);
          // Don't fail the request - order is fulfilled in our system
        }
      }

      // Log to audit trail
      await prisma.audit_logs.create({
        data: {
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          userEmail: session.user.email,
          userName: session.user.name,
          action: 'order.fulfilled',
          entityType: 'Order',
          entityId: order.id,
          changes: {
            orderNumber: order.orderNumber,
            trackingNumber,
            trackingCarrier,
            fulfilledBy: session.user.name,
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Order fulfilled successfully',
        order: {
          ...updatedOrder,
          total: updatedOrder.total.toNumber(),
          subtotal: updatedOrder.subtotal.toNumber(),
          tax: updatedOrder.tax.toNumber(),
          shipping: updatedOrder.shipping.toNumber(),
          discount: updatedOrder.discount.toNumber(),
        },
      });

    } catch (error: any) {
      console.error('Error fulfilling order:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
