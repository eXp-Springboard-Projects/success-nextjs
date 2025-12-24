/**
 * API Endpoint: /api/admin/sales-cs/dashboard
 * Returns aggregated stats for Sales & CS dashboard
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = supabaseAdmin();

    // Get date range (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Total revenue from all orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('total')
      .in('status', ['COMPLETED', 'PENDING', 'PROCESSING']);

    if (ordersError) throw ordersError;

    const totalRevenue = ordersData?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0;

    // Monthly revenue (last 30 days)
    const { data: monthlyOrdersData, error: monthlyError } = await supabase
      .from('orders')
      .select('total')
      .gte('createdAt', thirtyDaysAgo.toISOString())
      .in('status', ['COMPLETED', 'PENDING', 'PROCESSING']);

    if (monthlyError) throw monthlyError;

    const monthlyRevenue = monthlyOrdersData?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0;

    // Active subscriptions count
    const { count: activeSubscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (subsError) throw subsError;

    // Total customers (users)
    const { count: totalCustomers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Pending orders
    const { count: pendingOrders, error: pendingError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING');

    if (pendingError) throw pendingError;

    // Email subscribers
    const { count: emailSubscribers, error: emailError } = await supabase
      .from('email_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE');

    if (emailError) throw emailError;

    // Average order value
    const { data: completedOrders, error: completedError } = await supabase
      .from('orders')
      .select('total')
      .eq('status', 'COMPLETED');

    if (completedError) throw completedError;

    const averageOrderValue = completedOrders && completedOrders.length > 0
      ? completedOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) / completedOrders.length
      : 0;

    // Calculate churn rate (subscriptions canceled in last 30 days / total subscriptions)
    const { count: canceledSubscriptions, error: canceledError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'canceled')
      .gte('updatedAt', thirtyDaysAgo.toISOString());

    if (canceledError) throw canceledError;

    const { count: totalSubscriptions, error: totalSubsError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });

    if (totalSubsError) throw totalSubsError;

    const churnRate = totalSubscriptions && totalSubscriptions > 0
      ? ((canceledSubscriptions || 0) / totalSubscriptions) * 100
      : 0;

    const stats = {
      totalRevenue,
      monthlyRevenue,
      activeSubscriptions: activeSubscriptions || 0,
      totalCustomers: totalCustomers || 0,
      pendingOrders: pendingOrders || 0,
      emailSubscribers: emailSubscribers || 0,
      averageOrderValue,
      churnRate,
    };

    return res.status(200).json(stats);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
