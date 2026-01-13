import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';
import { stripe } from '../../../../lib/stripe';

// Type definitions for results
type TransactionSimple = { id: string; memberId: string; amount: number; createdAt: string; type?: string; status?: string; provider?: string };
type OrderSimple = { id: string; memberId: string; total: number; createdAt: string; status?: string; orderSource?: string };
type HistoricalItem = { memberId: string; createdAt: string };

/**
 * Comprehensive Revenue Analytics API
 * Aggregates data from: Stripe, subscriptions, transactions, orders
 * Supports: date ranges, payment providers, product types, refunds, CLV
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const supabase = supabaseAdmin();

    const {
      startDate: startDateParam,
      endDate: endDateParam,
      compareWithPrevious = 'false'
    } = req.query;

    if (!startDateParam || !endDateParam) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const startDate = new Date(startDateParam as string);
    const endDate = new Date(endDateParam as string);
    const startDateUnix = Math.floor(startDate.getTime() / 1000);
    const endDateUnix = Math.floor(endDate.getTime() / 1000);

    // Calculate previous period for comparison
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - daysDiff);
    const prevEndDate = new Date(startDate);
    const prevStartDateUnix = Math.floor(prevStartDate.getTime() / 1000);
    const prevEndDateUnix = Math.floor(prevEndDate.getTime() / 1000);

    // ==========================================
    // FETCH STRIPE DATA
    // ==========================================
    let stripeCharges: any[] = [];
    let stripeRefunds: any[] = [];
    let stripeSubscriptions: any[] = [];
    let stripeBalance: any = null;

    if (stripe) {
      try {
        const [charges, subs, balance] = await Promise.all([
          stripe.charges.list({
            limit: 100,
            created: { gte: startDateUnix, lte: endDateUnix },
          }),
          stripe.subscriptions.list({
            limit: 100,
            status: 'all',
          }),
          stripe.balance.retrieve(),
        ]);

        stripeCharges = charges.data.filter(c => c.status === 'succeeded');
        stripeRefunds = charges.data.filter(c => c.refunded);
        stripeSubscriptions = subs.data;
        stripeBalance = balance;
      } catch (err) {
        console.error('Stripe API error:', err);
        // Continue without Stripe data
      }
    }

    // ==========================================
    // 1. TRANSACTIONS DATA (All Payments)
    // ==========================================
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*, member:members(*)')
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString())
      .in('status', ['succeeded', 'completed']);

    if (transactionsError) throw new Error(transactionsError.message);

    const { data: prevTransactions, error: prevTransactionsError } = compareWithPrevious === 'true'
      ? await supabase
          .from('transactions')
          .select('*')
          .gte('createdAt', prevStartDate.toISOString())
          .lt('createdAt', prevEndDate.toISOString())
          .in('status', ['succeeded', 'completed'])
      : { data: [], error: null };

    if (prevTransactionsError) throw new Error(prevTransactionsError.message);

    // ==========================================
    // 2. ORDERS DATA (WooCommerce, Stripe, InHouse)
    // ==========================================
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*, member:members(*), order_items(*, products(*))')
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString())
      .in('status', ['COMPLETED', 'PROCESSING']);

    if (ordersError) throw new Error(ordersError.message);

    const { data: prevOrders, error: prevOrdersError } = compareWithPrevious === 'true'
      ? await supabase
          .from('orders')
          .select('*')
          .gte('createdAt', prevStartDate.toISOString())
          .lt('createdAt', prevEndDate.toISOString())
          .in('status', ['COMPLETED', 'PROCESSING'])
      : { data: [], error: null };

    if (prevOrdersError) throw new Error(prevOrdersError.message);

    // ==========================================
    // 3. SUBSCRIPTIONS DATA (SUCCESS+)
    // ==========================================
    const { count: activeSubscriptions, error: activeSubsError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE');

    if (activeSubsError) throw new Error(activeSubsError.message);

    const { count: newSubscriptions, error: newSubsError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString());

    if (newSubsError) throw new Error(newSubsError.message);

    const { count: prevNewSubscriptions, error: prevNewSubsError } = compareWithPrevious === 'true'
      ? await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .gte('createdAt', prevStartDate.toISOString())
          .lt('createdAt', prevEndDate.toISOString())
      : { count: 0, error: null };

    if (prevNewSubsError) throw new Error(prevNewSubsError.message);

    // ==========================================
    // 4. REFUNDS & DISPUTES
    // ==========================================
    const { data: refunds, error: refundsError } = await supabase
      .from('transactions')
      .select('*')
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString())
      .or('status.eq.refunded,type.eq.refund');

    if (refundsError) throw new Error(refundsError.message);

    const { data: prevRefunds, error: prevRefundsError } = compareWithPrevious === 'true'
      ? await supabase
          .from('transactions')
          .select('*')
          .gte('createdAt', prevStartDate.toISOString())
          .lt('createdAt', prevEndDate.toISOString())
          .or('status.eq.refunded,type.eq.refund')
      : { data: [], error: null };

    if (prevRefundsError) throw new Error(prevRefundsError.message);

    // ==========================================
    // CALCULATE METRICS
    // ==========================================

    // Total Revenue (include Stripe)
    const transactionRevenue = (transactions || []).reduce((sum: number, t: any) => sum + parseFloat(t.amount.toString()), 0);
    const orderRevenue = (orders || []).reduce((sum: number, o: any) => sum + parseFloat(o.total.toString()), 0);
    const stripeRevenue = stripeCharges.reduce((sum, c) => sum + (c.amount / 100), 0);
    const totalRevenue = transactionRevenue + orderRevenue + stripeRevenue;

    const prevTransactionRevenue = (prevTransactions || []).reduce((sum: number, t: any) => sum + parseFloat(t.amount.toString()), 0);
    const prevOrderRevenue = (prevOrders || []).reduce((sum: number, o: any) => sum + parseFloat(o.total.toString()), 0);
    const prevTotalRevenue = prevTransactionRevenue + prevOrderRevenue;

    const revenueGrowth = prevTotalRevenue > 0
      ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
      : 0;

    // Total Transactions (include Stripe)
    const totalTransactions = (transactions?.length || 0) + (orders?.length || 0) + stripeCharges.length;
    const prevTotalTransactions = (prevTransactions?.length || 0) + (prevOrders?.length || 0);
    const transactionsGrowth = prevTotalTransactions > 0
      ? ((totalTransactions - prevTotalTransactions) / prevTotalTransactions) * 100
      : 0;

    // Average Order Value
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const prevAverageOrderValue = prevTotalTransactions > 0 ? prevTotalRevenue / prevTotalTransactions : 0;
    const aovGrowth = prevAverageOrderValue > 0
      ? ((averageOrderValue - prevAverageOrderValue) / prevAverageOrderValue) * 100
      : 0;

    // Monthly Recurring Revenue (from active subscriptions + Stripe)
    const subscriptionPrice = 9.99; // TODO: Get from products table
    const stripeMRR = stripeSubscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => {
        const price = s.items.data[0]?.price;
        if (!price) return sum;
        const amount = price.unit_amount || 0;
        // Convert to monthly (if yearly, divide by 12)
        const monthlyAmount = price.recurring?.interval === 'year' ? amount / 12 : amount;
        return sum + (monthlyAmount / 100);
      }, 0);
    const mrr = ((activeSubscriptions || 0) * subscriptionPrice) + stripeMRR;

    // Refund amounts (include Stripe)
    const stripeRefundAmount = stripeRefunds.reduce((sum, c) => sum + ((c.amount_refunded || 0) / 100), 0);
    const refundAmount = (refunds || []).reduce((sum: number, r: any) => sum + Math.abs(parseFloat(r.amount.toString())), 0) + stripeRefundAmount;
    const prevRefundAmount = (prevRefunds || []).reduce((sum: number, r: any) => sum + Math.abs(parseFloat(r.amount.toString())), 0);

    // Refund Rate
    const refundRate = totalRevenue > 0 ? (refundAmount / totalRevenue) * 100 : 0;
    const prevRefundRate = prevTotalRevenue > 0 ? (prevRefundAmount / prevTotalRevenue) * 100 : 0;
    const refundRateChange = prevRefundRate > 0
      ? ((refundRate - prevRefundRate) / prevRefundRate) * 100
      : 0;

    // ==========================================
    // REVENUE BY PAYMENT PROVIDER
    // ==========================================
    const revenueByProvider: Record<string, number> = {
      Stripe: 0,
      PayKickstart: 0,
      WooCommerce: 0,
      Other: 0,
    };

    (transactions || []).forEach((t: any) => {
      const provider = t.provider || 'Other';
      const key = provider === 'stripe' ? 'Stripe'
                : provider === 'paykickstart' ? 'PayKickstart'
                : provider === 'woocommerce' ? 'WooCommerce'
                : 'Other';
      revenueByProvider[key] += parseFloat(t.amount.toString());
    });

    (orders || []).forEach((o: any) => {
      const source = o.orderSource || 'InHouse';
      const key = source === 'WooCommerce' ? 'WooCommerce'
                : source === 'Stripe' ? 'Stripe'
                : 'Other';
      revenueByProvider[key] += parseFloat(o.total.toString());
    });

    // Add Stripe charges
    stripeCharges.forEach(c => {
      revenueByProvider['Stripe'] += c.amount / 100;
    });

    // ==========================================
    // REVENUE BY PRODUCT TYPE
    // ==========================================
    const revenueByProductType: Record<string, number> = {
      'SUCCESS+': 0,
      'Store': 0,
      'Magazine': 0,
      'Coaching': 0,
      'Other': 0,
    };

    // Subscriptions are SUCCESS+
    const successPlusRevenue = (transactions || [])
      .filter((t: any) => t.type === 'subscription')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount.toString()), 0);
    revenueByProductType['SUCCESS+'] = successPlusRevenue;

    // Orders from WooCommerce store
    const storeRevenue = (orders || [])
      .filter((o: any) => o.orderSource === 'WooCommerce')
      .reduce((sum: number, o: any) => sum + parseFloat(o.total.toString()), 0);
    revenueByProductType['Store'] = storeRevenue;

    // Other transactions
    const otherRevenue = (transactions || [])
      .filter((t: any) => t.type !== 'subscription')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount.toString()), 0);
    revenueByProductType['Other'] = otherRevenue;

    // ==========================================
    // NEW VS RETURNING CUSTOMER REVENUE
    // ==========================================
    const customerFirstPurchase = new Map<string, Date>();

    // Get all historical transactions/orders to determine first purchase date
    const { data: allHistoricalTransactions, error: histTransError } = await supabase
      .from('transactions')
      .select('memberId, createdAt')
      .in('status', ['succeeded', 'completed'])
      .order('createdAt', { ascending: true });

    if (histTransError) throw new Error(histTransError.message);

    const { data: allHistoricalOrders, error: histOrdersError } = await supabase
      .from('orders')
      .select('memberId, createdAt')
      .in('status', ['COMPLETED', 'PROCESSING'])
      .order('createdAt', { ascending: true });

    if (histOrdersError) throw new Error(histOrdersError.message);

    // Build map of first purchase dates
    [...(allHistoricalTransactions || []), ...(allHistoricalOrders || [])].forEach((item: any) => {
      if (!customerFirstPurchase.has(item.memberId)) {
        customerFirstPurchase.set(item.memberId, new Date(item.createdAt));
      }
    });

    let newCustomerRevenue = 0;
    let returningCustomerRevenue = 0;

    (transactions || []).forEach((t: any) => {
      const firstPurchase = customerFirstPurchase.get(t.memberId);
      const isNew = firstPurchase && firstPurchase >= startDate && firstPurchase <= endDate;
      const amount = parseFloat(t.amount.toString());
      if (isNew) {
        newCustomerRevenue += amount;
      } else {
        returningCustomerRevenue += amount;
      }
    });

    (orders || []).forEach((o: any) => {
      const firstPurchase = customerFirstPurchase.get(o.memberId);
      const isNew = firstPurchase && firstPurchase >= startDate && firstPurchase <= endDate;
      const amount = parseFloat(o.total.toString());
      if (isNew) {
        newCustomerRevenue += amount;
      } else {
        returningCustomerRevenue += amount;
      }
    });

    // ==========================================
    // CUSTOMER LIFETIME VALUE (CLV)
    // ==========================================
    const memberIds = new Set([
      ...(transactions || []).map((t: any) => t.memberId),
      ...(orders || []).map((o: any) => o.memberId),
    ]);

    const memberLifetimeValues = await Promise.all(
      Array.from(memberIds).map(async (memberId) => {
        const { data: memberTransactions, error: mtError } = await supabase
          .from('transactions')
          .select('*')
          .eq('memberId', memberId)
          .in('status', ['succeeded', 'completed']);

        if (mtError) throw new Error(mtError.message);

        const { data: memberOrders, error: moError } = await supabase
          .from('orders')
          .select('*')
          .eq('memberId', memberId)
          .in('status', ['COMPLETED', 'PROCESSING']);

        if (moError) throw new Error(moError.message);

        const totalValue =
          (memberTransactions || []).reduce((sum: number, t: any) => sum + parseFloat(t.amount.toString()), 0) +
          (memberOrders || []).reduce((sum: number, o: any) => sum + parseFloat(o.total.toString()), 0);
        return totalValue;
      })
    );

    const averageClv = memberLifetimeValues.length > 0
      ? memberLifetimeValues.reduce((sum: number, v: number) => sum + v, 0) / memberLifetimeValues.length
      : 0;

    // ==========================================
    // DAILY REVENUE TREND (for charts)
    // ==========================================
    const dailyRevenue: { date: string; revenue: number; transactions: number; refunds: number }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTransactions = (transactions || []).filter(
        (t: any) => new Date(t.createdAt) >= dayStart && new Date(t.createdAt) <= dayEnd
      );
      const dayOrders = (orders || []).filter(
        (o: any) => new Date(o.createdAt) >= dayStart && new Date(o.createdAt) <= dayEnd
      );
      const dayRefunds = (refunds || []).filter(
        (r: any) => new Date(r.createdAt) >= dayStart && new Date(r.createdAt) <= dayEnd
      );

      const dayRevenue =
        dayTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount.toString()), 0) +
        dayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total.toString()), 0);
      const dayRefundAmount = dayRefunds.reduce((sum: number, r: any) => sum + Math.abs(parseFloat(r.amount.toString())), 0);

      dailyRevenue.push({
        date: currentDate.toISOString().split('T')[0],
        revenue: dayRevenue,
        transactions: dayTransactions.length + dayOrders.length,
        refunds: dayRefundAmount,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // ==========================================
    // RESPONSE
    // ==========================================
    return res.status(200).json({
      // Key Metrics
      totalRevenue,
      revenueGrowth,
      mrr,
      averageOrderValue,
      aovGrowth,
      totalTransactions,
      transactionsGrowth,
      refundRate,
      refundRateChange,
      averageClv,

      // Previous Period Comparison
      previousPeriod: {
        totalRevenue: prevTotalRevenue,
        totalTransactions: prevTotalTransactions,
        averageOrderValue: prevAverageOrderValue,
        refundRate: prevRefundRate,
      },

      // Breakdowns
      revenueByProvider,
      revenueByProductType,
      newVsReturning: {
        newCustomerRevenue,
        returningCustomerRevenue,
      },

      // Subscriptions
      activeSubscriptions: activeSubscriptions || 0,
      newSubscriptions: newSubscriptions || 0,
      newSubscriptionsGrowth: (prevNewSubscriptions || 0) > 0
        ? (((newSubscriptions || 0) - (prevNewSubscriptions || 0)) / (prevNewSubscriptions || 0)) * 100
        : 0,

      // Trends
      dailyRevenue,

      // Counts
      refundCount: (refunds?.length || 0) + stripeRefunds.length,
      refundAmount,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: errorMessage });
  }
}
