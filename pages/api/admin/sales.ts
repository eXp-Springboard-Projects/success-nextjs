/**
 * API Endpoint: /api/admin/sales
 * Unified sales and subscriptions data for all revenue streams
 * Integrates: Stripe, Database Subscriptions, Database Orders
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { stripe } from '../../../lib/stripe';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only ADMIN and SUPER_ADMIN can access sales data
  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = supabaseAdmin();

    const { filter = 'all', days = '30' } = req.query;
    const daysInt = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysInt);
    const startDateUnix = Math.floor(startDate.getTime() / 1000);

    // Fetch Stripe data if configured
    let stripeCharges: any[] = [];
    let stripeSubscriptions: any[] = [];

    if (stripe) {
      try {
        const [charges, subs] = await Promise.all([
          stripe.charges.list({
            limit: 100,
            created: { gte: startDateUnix },
          }),
          stripe.subscriptions.list({
            limit: 100,
            status: 'all',
          }),
        ]);
        stripeCharges = charges.data.filter(c => c.status === 'succeeded');
        stripeSubscriptions = subs.data;
      } catch (err) {
        console.error('Stripe API error:', err);
        // Continue without Stripe data if it fails
      }
    }

    // Get subscriptions (SUCCESS+ and Magazine)
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*, users(name, email), magazine_subscriptions(*)')
      .gte('createdAt', startDate.toISOString())
      .order('createdAt', { ascending: false });

    if (subsError) throw new Error(subsError.message);

    // Get store orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('createdAt', startDate.toISOString())
      .order('createdAt', { ascending: false });

    if (ordersError) throw new Error(ordersError.message);

    // Transform subscriptions into transactions
    const subscriptionTransactions = (subscriptions || []).map((sub: any) => {
      const isMagazine = !!sub.magazine_subscriptions;
      const amount = isMagazine ? 19.99 : 9.99; // Default prices (should come from tier/plan)

      return {
        id: sub.id,
        type: 'subscription' as const,
        productName: isMagazine ? 'SUCCESS Magazine (Print)' : 'SUCCESS+ Digital',
        customerName: sub.users?.name || 'Unknown',
        customerEmail: sub.users?.email || 'Unknown',
        amount,
        status: sub.status,
        createdAt: sub.createdAt,
        provider: sub.provider,
      };
    });

    // Transform orders into transactions
    const orderTransactions = (orders || []).map((order: any) => ({
      id: order.id,
      type: 'order' as const,
      productName: `Order #${order.orderNumber}`,
      customerName: order.userName,
      customerEmail: order.userEmail,
      amount: parseFloat(order.total.toString()),
      status: order.status.toLowerCase(),
      createdAt: order.createdAt,
      provider: 'database',
    }));

    // Transform Stripe charges into transactions
    const stripeChargeTransactions = stripeCharges.map((charge: any) => ({
      id: charge.id,
      type: 'order' as const,
      productName: charge.description || 'Stripe Payment',
      customerName: charge.billing_details?.name || 'Stripe Customer',
      customerEmail: charge.receipt_email || charge.billing_details?.email || 'N/A',
      amount: charge.amount / 100, // Convert from cents
      status: charge.refunded ? 'refunded' : 'completed',
      createdAt: new Date(charge.created * 1000).toISOString(),
      provider: 'stripe',
    }));

    // Transform Stripe subscriptions into transactions
    const stripeSubTransactions = stripeSubscriptions
      .filter((sub: any) => new Date((sub as any).created * 1000) >= startDate)
      .map((sub: any) => ({
        id: sub.id,
        type: 'subscription' as const,
        productName: sub.items.data[0]?.price?.nickname || 'Stripe Subscription',
        customerName: 'Stripe Customer',
        customerEmail: 'See Stripe Dashboard',
        amount: (sub.items.data[0]?.price?.unit_amount || 0) / 100,
        status: sub.status,
        createdAt: new Date((sub as any).created * 1000).toISOString(),
        provider: 'stripe',
      }));

    // Combine all transactions
    let allTransactions = [
      ...subscriptionTransactions,
      ...orderTransactions,
      ...stripeChargeTransactions,
      ...stripeSubTransactions,
    ];

    // Apply filter
    if (filter === 'subscriptions') {
      allTransactions = [...subscriptionTransactions, ...stripeSubTransactions];
    } else if (filter === 'orders') {
      allTransactions = [...orderTransactions, ...stripeChargeTransactions];
    } else if (filter === 'coaching') {
      // TODO: Add coaching transactions when coaching system is implemented
      allTransactions = [];
    }

    // Sort by date
    allTransactions.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Calculate stats
    const totalRevenue = allTransactions.reduce((sum, t) => sum + t.amount, 0);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthlyRevenue = allTransactions
      .filter(t => new Date(t.createdAt) >= monthAgo)
      .reduce((sum, t) => sum + t.amount, 0);

    const activeSubscriptions = (subscriptions || []).filter(
      (sub: any) => sub.status === 'active'
    ).length + stripeSubscriptions.filter(s => s.status === 'active').length;

    const totalOrders = (orders?.length || 0) + stripeCharges.length;

    const averageOrderValue = totalOrders > 0
      ? orderTransactions.reduce((sum: number, t: { amount: number }) => sum + t.amount, 0) / totalOrders
      : 0;

    // Calculate revenue by type
    const successPlusRevenue = (subscriptions || [])
      .filter((sub: any) => !sub.magazine_subscriptions && sub.status === 'active')
      .reduce((sum: number) => sum + 9.99, 0) + // TODO: Get actual price from tier
      stripeSubscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + ((s.items.data[0]?.price?.unit_amount || 0) / 100), 0);

    const magazineRevenue = (subscriptions || [])
      .filter((sub: any) => sub.magazine_subscriptions && sub.status === 'active')
      .reduce((sum: number) => sum + 19.99, 0); // TODO: Get actual price

    const storeRevenue = (orders || [])
      .filter((order: any) => order.status === 'COMPLETED')
      .reduce((sum: number, order: any) => sum + parseFloat(order.total.toString()), 0) +
      stripeCharges.reduce((sum, c) => sum + (c.amount / 100), 0);

    const coachingRevenue = 0; // TODO: Implement coaching revenue tracking

    return res.status(200).json({
      stats: {
        totalRevenue,
        monthlyRevenue,
        activeSubscriptions,
        totalOrders,
        averageOrderValue,
      },
      transactions: allTransactions.slice(0, 100), // Limit to 100 for performance
      revenueByType: {
        successPlus: successPlusRevenue,
        magazine: magazineRevenue,
        store: storeRevenue,
        coaching: coachingRevenue,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
