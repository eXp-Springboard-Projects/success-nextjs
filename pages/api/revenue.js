import { supabaseAdmin } from '../../lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req, res) {
  // ⚠️ SECURITY: Require admin authentication
  const session = await getServerSession(req, res, authOptions);

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(401).json({ error: 'Unauthorized - Admin access required' });
  }

  const { method } = req;

  if (method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    const { range = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get all active subscriptions
    const { data: activeSubscriptions, error: activeError } = await supabase
      .from('subscriptions')
      .select('*, users(*)')
      .eq('status', 'ACTIVE');

    if (activeError) throw activeError;

    // Calculate revenue metrics
    // Assuming a fixed price of $9.99/month for SUCCESS+
    const pricePerMonth = 9.99;
    const monthlyRevenue = (activeSubscriptions || []).length * pricePerMonth;

    // Get total subscriptions in the time range
    const { count: totalSubscriptionsInRange, error: totalError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', startDate.toISOString());

    if (totalError) throw totalError;

    // Get canceled subscriptions in the time range
    const { count: canceledInRange, error: canceledError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'CANCELED')
      .gte('updatedAt', startDate.toISOString());

    if (canceledError) throw canceledError;

    // Calculate churn rate
    const churnRate = totalSubscriptionsInRange > 0
      ? ((canceledInRange || 0) / totalSubscriptionsInRange) * 100
      : 0;

    // Calculate ARPU (Average Revenue Per User)
    const averageRevenuePerUser = (activeSubscriptions || []).length > 0
      ? monthlyRevenue / (activeSubscriptions || []).length
      : 0;

    // Generate monthly data for chart
    const monthlyData = [];
    const monthsToShow = range === 'month' ? 4 : range === 'quarter' ? 3 : 12;

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const { count: subsInMonth, error: monthError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')
        .lte('createdAt', monthEnd.toISOString())
        .or(`updatedAt.gte.${monthStart.toISOString()},createdAt.gte.${monthStart.toISOString()}`);

      if (monthError) throw monthError;

      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: (subsInMonth || 0) * pricePerMonth,
        subscriptions: subsInMonth || 0,
      });
    }

    // Calculate total revenue (all-time)
    const { count: totalSubscriptions, error: allSubsError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['ACTIVE', 'CANCELED']);

    if (allSubsError) throw allSubsError;

    // Rough estimate of total revenue (this would be better tracked in a separate table)
    const totalRevenue = (totalSubscriptions || 0) * pricePerMonth * 6; // Assuming avg 6 months

    const revenueData = {
      totalRevenue,
      monthlyRevenue,
      activeSubscriptions: (activeSubscriptions || []).length,
      churnRate,
      averageRevenuePerUser,
      monthlyData,
    };

    return res.status(200).json(revenueData);
  } catch (error) {
    console.error('Revenue error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
