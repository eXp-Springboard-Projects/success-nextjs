import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';
import { Prisma } from '@prisma/client';

// Type definitions for Prisma results
type Transaction = Prisma.transactionsGetPayload<{ include: { member: true } }>;
type TransactionSimple = Prisma.transactionsGetPayload<{}>;
type Order = Prisma.ordersGetPayload<{ include: { member: true; order_items: { include: { products: true } } } }>;
type OrderSimple = Prisma.ordersGetPayload<{}>;
type HistoricalItem = { memberId: string; createdAt: Date };

/**
 * Comprehensive Revenue Analytics API
 * Aggregates data from: subscriptions, transactions, orders
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

    // Calculate previous period for comparison
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - daysDiff);
    const prevEndDate = new Date(startDate);

    // ==========================================
    // 1. TRANSACTIONS DATA (All Payments)
    // ==========================================
    const transactions = await prisma.transactions.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['succeeded', 'completed'] },
      },
      include: {
        member: true,
      },
    });

    const prevTransactions = compareWithPrevious === 'true' ? await prisma.transactions.findMany({
      where: {
        createdAt: {
          gte: prevStartDate,
          lt: prevEndDate,
        },
        status: { in: ['succeeded', 'completed'] },
      },
    }) : [];

    // ==========================================
    // 2. ORDERS DATA (WooCommerce, Stripe, InHouse)
    // ==========================================
    const orders = await prisma.orders.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['COMPLETED', 'PROCESSING'] },
      },
      include: {
        member: true,
        order_items: {
          include: {
            products: true,
          },
        },
      },
    });

    const prevOrders = compareWithPrevious === 'true' ? await prisma.orders.findMany({
      where: {
        createdAt: {
          gte: prevStartDate,
          lt: prevEndDate,
        },
        status: { in: ['COMPLETED', 'PROCESSING'] },
      },
    }) : [];

    // ==========================================
    // 3. SUBSCRIPTIONS DATA (SUCCESS+)
    // ==========================================
    const activeSubscriptions = await prisma.subscriptions.count({
      where: {
        status: 'ACTIVE',
      },
    });

    const newSubscriptions = await prisma.subscriptions.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const prevNewSubscriptions = compareWithPrevious === 'true' ? await prisma.subscriptions.count({
      where: {
        createdAt: {
          gte: prevStartDate,
          lt: prevEndDate,
        },
      },
    }) : 0;

    // ==========================================
    // 4. REFUNDS & DISPUTES
    // ==========================================
    const refunds = await prisma.transactions.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        OR: [
          { status: 'refunded' },
          { type: 'refund' },
        ],
      },
    });

    const prevRefunds = compareWithPrevious === 'true' ? await prisma.transactions.findMany({
      where: {
        createdAt: {
          gte: prevStartDate,
          lt: prevEndDate,
        },
        OR: [
          { status: 'refunded' },
          { type: 'refund' },
        ],
      },
    }) : [];

    // ==========================================
    // CALCULATE METRICS
    // ==========================================

    // Total Revenue
    const transactionRevenue = transactions.reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount.toString()), 0);
    const orderRevenue = orders.reduce((sum: number, o: Order) => sum + parseFloat(o.total.toString()), 0);
    const totalRevenue = transactionRevenue + orderRevenue;

    const prevTransactionRevenue = prevTransactions.reduce((sum: number, t: TransactionSimple) => sum + parseFloat(t.amount.toString()), 0);
    const prevOrderRevenue = prevOrders.reduce((sum: number, o: OrderSimple) => sum + parseFloat(o.total.toString()), 0);
    const prevTotalRevenue = prevTransactionRevenue + prevOrderRevenue;

    const revenueGrowth = prevTotalRevenue > 0
      ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
      : 0;

    // Total Transactions
    const totalTransactions = transactions.length + orders.length;
    const prevTotalTransactions = prevTransactions.length + prevOrders.length;
    const transactionsGrowth = prevTotalTransactions > 0
      ? ((totalTransactions - prevTotalTransactions) / prevTotalTransactions) * 100
      : 0;

    // Average Order Value
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const prevAverageOrderValue = prevTotalTransactions > 0 ? prevTotalRevenue / prevTotalTransactions : 0;
    const aovGrowth = prevAverageOrderValue > 0
      ? ((averageOrderValue - prevAverageOrderValue) / prevAverageOrderValue) * 100
      : 0;

    // Monthly Recurring Revenue (from active subscriptions)
    const subscriptionPrice = 9.99; // TODO: Get from products table
    const mrr = activeSubscriptions * subscriptionPrice;

    // Refund amounts
    const refundAmount = refunds.reduce((sum: number, r: TransactionSimple) => sum + Math.abs(parseFloat(r.amount.toString())), 0);
    const prevRefundAmount = prevRefunds.reduce((sum: number, r: TransactionSimple) => sum + Math.abs(parseFloat(r.amount.toString())), 0);

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

    transactions.forEach((t: Transaction) => {
      const provider = t.provider || 'Other';
      const key = provider === 'stripe' ? 'Stripe'
                : provider === 'paykickstart' ? 'PayKickstart'
                : provider === 'woocommerce' ? 'WooCommerce'
                : 'Other';
      revenueByProvider[key] += parseFloat(t.amount.toString());
    });

    orders.forEach((o: Order) => {
      const source = o.orderSource || 'InHouse';
      const key = source === 'WooCommerce' ? 'WooCommerce'
                : source === 'Stripe' ? 'Stripe'
                : 'Other';
      revenueByProvider[key] += parseFloat(o.total.toString());
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
    const successPlusRevenue = transactions
      .filter((t: Transaction) => t.type === 'subscription')
      .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount.toString()), 0);
    revenueByProductType['SUCCESS+'] = successPlusRevenue;

    // Orders from WooCommerce store
    const storeRevenue = orders
      .filter((o: Order) => o.orderSource === 'WooCommerce')
      .reduce((sum: number, o: Order) => sum + parseFloat(o.total.toString()), 0);
    revenueByProductType['Store'] = storeRevenue;

    // Other transactions
    const otherRevenue = transactions
      .filter((t: Transaction) => t.type !== 'subscription')
      .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount.toString()), 0);
    revenueByProductType['Other'] = otherRevenue;

    // ==========================================
    // NEW VS RETURNING CUSTOMER REVENUE
    // ==========================================
    const customerFirstPurchase = new Map<string, Date>();

    // Get all historical transactions/orders to determine first purchase date
    const allHistoricalTransactions = await prisma.transactions.findMany({
      where: { status: { in: ['succeeded', 'completed'] } },
      select: { memberId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const allHistoricalOrders = await prisma.orders.findMany({
      where: { status: { in: ['COMPLETED', 'PROCESSING'] } },
      select: { memberId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Build map of first purchase dates
    [...allHistoricalTransactions, ...allHistoricalOrders].forEach((item: HistoricalItem) => {
      if (!customerFirstPurchase.has(item.memberId)) {
        customerFirstPurchase.set(item.memberId, item.createdAt);
      }
    });

    let newCustomerRevenue = 0;
    let returningCustomerRevenue = 0;

    transactions.forEach((t: Transaction) => {
      const firstPurchase = customerFirstPurchase.get(t.memberId);
      const isNew = firstPurchase && firstPurchase >= startDate && firstPurchase <= endDate;
      const amount = parseFloat(t.amount.toString());
      if (isNew) {
        newCustomerRevenue += amount;
      } else {
        returningCustomerRevenue += amount;
      }
    });

    orders.forEach((o: Order) => {
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
      ...transactions.map((t: Transaction) => t.memberId),
      ...orders.map((o: Order) => o.memberId),
    ]);

    const memberLifetimeValues = await Promise.all(
      Array.from(memberIds).map(async (memberId) => {
        const memberTransactions = await prisma.transactions.findMany({
          where: {
            memberId,
            status: { in: ['succeeded', 'completed'] },
          },
        });
        const memberOrders = await prisma.orders.findMany({
          where: {
            memberId,
            status: { in: ['COMPLETED', 'PROCESSING'] },
          },
        });
        const totalValue =
          memberTransactions.reduce((sum: number, t: TransactionSimple) => sum + parseFloat(t.amount.toString()), 0) +
          memberOrders.reduce((sum: number, o: OrderSimple) => sum + parseFloat(o.total.toString()), 0);
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

      const dayTransactions = transactions.filter(
        (t: Transaction) => t.createdAt >= dayStart && t.createdAt <= dayEnd
      );
      const dayOrders = orders.filter(
        (o: Order) => o.createdAt >= dayStart && o.createdAt <= dayEnd
      );
      const dayRefunds = refunds.filter(
        (r: TransactionSimple) => r.createdAt >= dayStart && r.createdAt <= dayEnd
      );

      const dayRevenue =
        dayTransactions.reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount.toString()), 0) +
        dayOrders.reduce((sum: number, o: Order) => sum + parseFloat(o.total.toString()), 0);
      const dayRefundAmount = dayRefunds.reduce((sum: number, r: TransactionSimple) => sum + Math.abs(parseFloat(r.amount.toString())), 0);

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
      activeSubscriptions,
      newSubscriptions,
      newSubscriptionsGrowth: prevNewSubscriptions > 0
        ? ((newSubscriptions - prevNewSubscriptions) / prevNewSubscriptions) * 100
        : 0,

      // Trends
      dailyRevenue,

      // Counts
      refundCount: refunds.length,
      refundAmount,
    });
  } catch (error: unknown) {
    console.error('Error fetching revenue analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: errorMessage });
  }
}
