/**
 * API: Get all orders with fulfillment status
 * Filter by status, source, fulfillment status
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = supabaseAdmin();

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  if (req.method === 'GET') {
    try {
      const {
        status,
        orderSource,
        fulfillmentStatus,
        search,
        page = '1',
        limit = '50',
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      // Build query
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          ),
          member:members (
            id,
            firstName,
            lastName,
            email,
            phone
          )
        `, { count: 'exact' });

      // Apply filters
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (orderSource && orderSource !== 'all') {
        query = query.eq('orderSource', orderSource);
      }

      if (fulfillmentStatus && fulfillmentStatus !== 'all') {
        query = query.eq('fulfillmentStatus', fulfillmentStatus);
      }

      if (search) {
        query = query.or(`orderNumber.ilike.%${search}%,userName.ilike.%${search}%,userEmail.ilike.%${search}%,trackingNumber.ilike.%${search}%`);
      }

      // Apply pagination and ordering
      const { data: orders, error, count } = await query
        .order('createdAt', { ascending: false })
        .range(skip, skip + take - 1);

      if (error) {
        throw error;
      }

      // Transform data - convert Decimal fields to numbers
      const transformedOrders = (orders || []).map((order: any) => ({
        ...order,
        total: order.total || 0,
        subtotal: order.subtotal || 0,
        tax: order.tax || 0,
        shipping: order.shipping || 0,
        discount: order.discount || 0,
        order_items: (order.order_items || []).map((item: any) => ({
          ...item,
          price: item.price || 0,
          total: item.total || 0,
        })),
      }));

      return res.status(200).json({
        orders: transformedOrders,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / parseInt(limit as string)),
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
