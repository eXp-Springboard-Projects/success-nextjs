import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { stripe } from '../../../../lib/stripe';

/**
 * Stripe Dashboard API - Live Stripe Data
 * Shows current Stripe account financials and sales data
 * NO banking info or sensitive credentials - only sales/transaction data
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

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const { period = '30' } = req.query;
    const daysAgo = parseInt(period as string);
    const startDate = Math.floor(Date.now() / 1000) - (daysAgo * 24 * 60 * 60);

    // Fetch data in parallel for performance
    const [
      balance,
      charges,
      subscriptions,
      customers,
      invoices,
      paymentIntents,
    ] = await Promise.all([
      // Account balance
      stripe.balance.retrieve(),

      // Recent charges
      stripe.charges.list({
        limit: 100,
        created: { gte: startDate },
      }),

      // All subscriptions (active + canceled in period)
      stripe.subscriptions.list({
        limit: 100,
        status: 'all',
      }),

      // Customer count
      stripe.customers.list({
        limit: 100,
        created: { gte: startDate },
      }),

      // Recent invoices
      stripe.invoices.list({
        limit: 100,
        created: { gte: startDate },
      }),

      // Payment intents for successful payments
      stripe.paymentIntents.list({
        limit: 100,
        created: { gte: startDate },
      }),
    ]);

    // Calculate metrics
    const successfulCharges = charges.data.filter(c => c.status === 'succeeded');
    const totalRevenue = successfulCharges.reduce((sum, c) => sum + c.amount, 0) / 100; // Convert from cents
    const totalTransactions = successfulCharges.length;
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Refunds
    const refundedCharges = charges.data.filter(c => c.refunded);
    const totalRefunds = refundedCharges.reduce((sum, c) => sum + (c.amount_refunded || 0), 0) / 100;
    const refundCount = refundedCharges.length;
    const refundRate = totalRevenue > 0 ? (totalRefunds / totalRevenue) * 100 : 0;

    // Subscription metrics
    const activeSubscriptions = subscriptions.data.filter(s => s.status === 'active');
    const canceledInPeriod = subscriptions.data.filter(s =>
      s.status === 'canceled' && s.canceled_at && s.canceled_at >= startDate
    );
    const monthlyRecurringRevenue = activeSubscriptions.reduce((sum, sub) => {
      const price = sub.items.data[0]?.price;
      if (!price) return sum;
      const amount = price.unit_amount || 0;
      // Convert to monthly (if yearly, divide by 12)
      const monthlyAmount = price.recurring?.interval === 'year' ? amount / 12 : amount;
      return sum + monthlyAmount;
    }, 0) / 100;

    // Customer count
    const totalCustomers = customers.data.length;
    const customersWithSubscriptions = activeSubscriptions.length;

    // Payment methods breakdown
    const paymentMethodCounts: Record<string, number> = {};
    successfulCharges.forEach(charge => {
      const pm = charge.payment_method_details?.type || 'unknown';
      paymentMethodCounts[pm] = (paymentMethodCounts[pm] || 0) + 1;
    });

    // Daily revenue breakdown
    const dailyRevenue: Record<string, { revenue: number; transactions: number; refunds: number }> = {};
    successfulCharges.forEach(charge => {
      const date = new Date(charge.created * 1000).toISOString().split('T')[0];
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = { revenue: 0, transactions: 0, refunds: 0 };
      }
      dailyRevenue[date].revenue += charge.amount / 100;
      dailyRevenue[date].transactions += 1;
      if (charge.refunded) {
        dailyRevenue[date].refunds += (charge.amount_refunded || 0) / 100;
      }
    });

    // Recent transactions for display
    const recentTransactions = successfulCharges.slice(0, 20).map(charge => ({
      id: charge.id,
      amount: charge.amount / 100,
      currency: charge.currency.toUpperCase(),
      status: charge.status,
      created: charge.created,
      customer: charge.customer,
      description: charge.description || 'No description',
      receipt_email: charge.receipt_email,
      refunded: charge.refunded,
      payment_method: charge.payment_method_details?.type || 'unknown',
    }));

    // Subscription details
    const subscriptionDetails = activeSubscriptions.slice(0, 20).map(sub => ({
      id: sub.id,
      customer: sub.customer,
      status: sub.status,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      plan: sub.items.data[0]?.price?.nickname || sub.items.data[0]?.price?.id,
      amount: (sub.items.data[0]?.price?.unit_amount || 0) / 100,
      interval: sub.items.data[0]?.price?.recurring?.interval,
      created: sub.created,
    }));

    // Response data
    const dashboardData = {
      period: daysAgo,
      balance: {
        available: balance.available.map(b => ({
          amount: b.amount / 100,
          currency: b.currency.toUpperCase(),
        })),
        pending: balance.pending.map(b => ({
          amount: b.amount / 100,
          currency: b.currency.toUpperCase(),
        })),
      },
      revenue: {
        total: totalRevenue,
        transactions: totalTransactions,
        averageValue: averageTransactionValue,
      },
      refunds: {
        total: totalRefunds,
        count: refundCount,
        rate: refundRate,
      },
      subscriptions: {
        active: activeSubscriptions.length,
        canceledInPeriod: canceledInPeriod.length,
        monthlyRecurringRevenue,
        details: subscriptionDetails,
      },
      customers: {
        newInPeriod: totalCustomers,
        withActiveSubscriptions: customersWithSubscriptions,
      },
      paymentMethods: paymentMethodCounts,
      dailyRevenue: Object.entries(dailyRevenue).map(([date, data]) => ({
        date,
        ...data,
      })).sort((a, b) => a.date.localeCompare(b.date)),
      recentTransactions,
    };

    return res.status(200).json(dashboardData);

  } catch (error: any) {
    console.error('Stripe dashboard error:', error);
    return res.status(500).json({
      error: 'Failed to fetch Stripe data',
      message: error.message
    });
  }
}
