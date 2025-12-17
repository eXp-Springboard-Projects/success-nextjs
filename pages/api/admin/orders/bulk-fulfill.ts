/**
 * API: Bulk fulfill multiple orders
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';
import woocommerce from '../../../../lib/woocommerce';

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

  if (req.method === 'POST') {
    try {
      const { orderIds } = req.body;

      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: 'orderIds must be a non-empty array' });
      }

      const results = {
        success: [] as string[],
        failed: [] as { orderId: string; error: string }[],
      };

      // Process each order
      for (const orderId of orderIds) {
        try {
          const order = await prisma.orders.findUnique({
            where: { id: orderId },
          });

          if (!order) {
            results.failed.push({ orderId, error: 'Order not found' });
            continue;
          }

          // Update order
          await prisma.orders.update({
            where: { id: orderId },
            data: {
              fulfillmentStatus: 'FULFILLED',
              fulfilledAt: new Date(),
              fulfilledBy: session.user.id,
              status: 'COMPLETED',
              updatedAt: new Date(),
            },
          });

          // Sync to WooCommerce if applicable
          if (order.woocommerceOrderId) {
            try {
              await woocommerce.completeOrder(order.woocommerceOrderId);
            } catch (wooError) {
              console.error(`⚠️  Failed to sync order ${orderId} to WooCommerce:`, wooError);
              // Don't fail - order is fulfilled in our system
            }
          }

          // Log to audit trail
          await prisma.audit_logs.create({
            data: {
              id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: session.user.id,
              userEmail: session.user.email,
              userName: session.user.name,
              action: 'order.bulk_fulfilled',
              entityType: 'Order',
              entityId: orderId,
              changes: {
                orderNumber: order.orderNumber,
                fulfilledBy: session.user.name,
              },
            },
          });

          results.success.push(orderId);

        } catch (error: any) {
          console.error(`Error fulfilling order ${orderId}:`, error);
          results.failed.push({ orderId, error: error.message });
        }
      }

      return res.status(200).json({
        success: true,
        message: `Fulfilled ${results.success.length} orders`,
        results,
      });

    } catch (error: any) {
      console.error('Error bulk fulfilling orders:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
