import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { Department } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabase';
import { hasDepartmentAccess } from '@/lib/departmentAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req }) as any;

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check department access
    if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, Department.SUCCESS_PLUS)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const supabase = supabaseAdmin();

    // Fetch dashboard stats
    const [
      activeMembersResult,
      newMembersResult,
      cancelledLastMonthResult,
      cancelledTwoMonthsAgoResult,
      subscriptionsResult,
      recentActivityResult,
      activeTrialsResult,
      totalTrialsResult
    ] = await Promise.all([
      // Active SUCCESS+ members (count members with SUCCESSPlus tier)
      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('membership_tier', 'SUCCESSPlus')
        .eq('membership_status', 'Active'),

      // New members this month
      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('membership_tier', 'SUCCESSPlus')
        .gte('created_at', oneMonthAgo.toISOString()),

      // Cancelled last month (members who are no longer SUCCESSPlus)
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('tier', 'SUCCESSPlus')
        .in('status', ['inactive', 'canceled'])
        .gte('updated_at', oneMonthAgo.toISOString())
        .lt('updated_at', now.toISOString()),

      // Cancelled two months ago (for trend)
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('tier', 'SUCCESSPlus')
        .in('status', ['inactive', 'canceled'])
        .gte('updated_at', twoMonthsAgo.toISOString())
        .lt('updated_at', oneMonthAgo.toISOString()),

      // Get all active subscriptions for MRR calculation
      supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')
        .eq('tier', 'SUCCESSPlus'),

      // Recent member activity from staff activity feed
      supabase
        .from('staff_activity_feed')
        .select('*')
        .eq('department', Department.SUCCESS_PLUS)
        .order('created_at', { ascending: false })
        .limit(10),

      // Active trial users (trials that haven't expired yet)
      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .not('trial_ends_at', 'is', null)
        .gt('trial_ends_at', now.toISOString()),

      // Total trial users (all time)
      supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .not('trial_ends_at', 'is', null)
    ]);

    const activeMembers = activeMembersResult.count || 0;
    const newMembersThisMonth = newMembersResult.count || 0;
    const cancelledLastMonth = cancelledLastMonthResult.count || 0;
    const cancelledTwoMonthsAgo = cancelledTwoMonthsAgoResult.count || 0;
    const subscriptions = subscriptionsResult.data || [];
    const recentActivity = recentActivityResult.data || [];
    const activeTrials = activeTrialsResult.count || 0;
    const totalTrials = totalTrialsResult.count || 0;

    // Calculate Monthly Recurring Revenue (normalize annual to monthly)
    // Note: subscriptions table doesn't have amount/interval fields
    // This would need to be calculated from payment provider or pricing data
    const monthlyRecurringRevenue = subscriptions.length * 29.99; // Placeholder calculation

    // Calculate churn rate
    const totalActiveLastMonth = activeMembers + cancelledLastMonth;
    const churnRate = totalActiveLastMonth > 0
      ? (cancelledLastMonth / totalActiveLastMonth) * 100
      : 0;

    const stats = {
      activeMembers,
      newMembersThisMonth,
      churnRate,
      monthlyRecurringRevenue,
      activeTrials,
      totalTrials,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.entity_type?.toLowerCase() || 'member',
        description: activity.description || activity.action,
        timestamp: activity.created_at,
        user: activity.user_name
      }))
    };

    return res.status(200).json(stats);

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
