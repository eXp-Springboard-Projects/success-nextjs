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

  const supabase = supabaseAdmin();

  try {
    const session = await getSession({ req }) as any;

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check department access
    if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, Department.CUSTOMER_SERVICE)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const {
      search,
      status,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build the query
    let query = supabase
      .from('subscriptions')
      .select(`
        *,
        member:member_id (
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Execute the query
    const { data: subscriptions, error, count } = await query;

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    // Apply search filter in memory (since Supabase doesn't support OR across relations easily)
    let filteredSubscriptions = subscriptions || [];
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredSubscriptions = filteredSubscriptions.filter(sub =>
        sub.member?.email?.toLowerCase().includes(searchLower) ||
        sub.member?.first_name?.toLowerCase().includes(searchLower) ||
        sub.member?.last_name?.toLowerCase().includes(searchLower) ||
        sub.stripe_subscription_id?.toLowerCase().includes(searchLower)
      );
    }

    const total = search ? filteredSubscriptions.length : (count || 0);

    const response = {
      subscriptions: filteredSubscriptions.map(sub => ({
        id: sub.id,
        userId: sub.member_id,
        userName: sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : 'Unknown',
        userEmail: sub.member?.email || 'Unknown',
        planName: sub.tier || 'Unknown Plan',
        status: sub.status || 'unknown',
        nextBillingDate: sub.current_period_end,
        amount: 0, // TODO: Add amount field to subscriptions model
        interval: sub.billing_cycle || 'month',
        stripeSubscriptionId: sub.stripe_subscription_id,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in subscriptions handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
