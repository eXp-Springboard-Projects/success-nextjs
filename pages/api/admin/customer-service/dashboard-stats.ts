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
    if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, Department.CUSTOMER_SERVICE)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const supabase = supabaseAdmin();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    // Fetch dashboard stats
    const [
      activeSubscriptionsResult,
      failedPaymentsResult,
      refundsTodayResult,
      recentActivityResult
    ] = await Promise.all([
      // Active subscriptions count
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),

      // Failed payment attempts from webhook logs
      supabase
        .from('webhook_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Failed')
        .eq('event_type', 'invoice.payment_failed')
        .gte('created_at', twentyFourHoursAgo.toISOString()),

      // Refunds today
      supabase
        .from('refund_disputes')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'REFUND')
        .gte('created_at', todayStart.toISOString()),

      // Recent activity from staff activity feed
      supabase
        .from('staff_activity_feed')
        .select('*')
        .eq('department', Department.CUSTOMER_SERVICE)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    const activeSubscriptions = activeSubscriptionsResult.count || 0;
    const failedPayments = failedPaymentsResult.count || 0;
    const refundsToday = refundsTodayResult.count || 0;
    const recentActivity = recentActivityResult.data || [];

    // Get pending items (failed payments that need attention)
    const { data: pendingFailedPayments } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('status', 'Failed')
      .eq('event_type', 'invoice.payment_failed')
      .lt('attempts', 3)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get open refund disputes
    const { data: openDisputes } = await supabase
      .from('refund_disputes')
      .select('*')
      .in('status', ['OPEN', 'IN_PROGRESS'])
      .order('priority', { ascending: false })
      .limit(5);

    const pendingItems = [
      ...(pendingFailedPayments || []).map((payment: any) => ({
        id: payment.id,
        type: 'Failed Payment',
        description: `Payment failed for ${payment.provider} - ${payment.event_id || 'Unknown'}`,
        priority: 'high' as const
      })),
      ...(openDisputes || []).map((dispute: any) => ({
        id: dispute.id,
        type: 'Refund Dispute',
        description: dispute.description || 'Dispute requires attention',
        priority: dispute.priority.toLowerCase() as 'high' | 'medium' | 'low'
      }))
    ];

    const stats = {
      activeSubscriptions,
      openTickets: openDisputes?.length || 0, // Using refund disputes as "tickets"
      refundsToday,
      failedPayments,
      recentActivity: recentActivity.map((activity: any) => ({
        id: activity.id,
        type: activity.entity_type?.toLowerCase() || 'unknown',
        description: activity.description || activity.action,
        timestamp: activity.created_at,
        user: activity.user_name
      })),
      pendingItems: pendingItems.slice(0, 10)
    };

    return res.status(200).json(stats);

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
