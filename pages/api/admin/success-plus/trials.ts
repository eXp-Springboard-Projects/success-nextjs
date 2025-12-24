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
    const supabase = supabaseAdmin();

    // Get all trial users from members table
    const { data: trialMembers, error: membersError } = await supabase
      .from('members')
      .select(`
        *,
        subscriptions!inner(*)
      `)
      .not('trial_ends_at', 'is', null)
      .eq('subscriptions.tier', 'SUCCESS_PLUS_TRIAL')
      .order('trial_ends_at', { ascending: true });

    if (membersError) {
      throw membersError;
    }

    // Calculate stats
    const allTrials = trialMembers?.length || 0;

    const activeTrials = trialMembers?.filter(
      (member) => member.trial_ends_at && new Date(member.trial_ends_at) > now
    ) || [];

    const expiredTrials = trialMembers?.filter(
      (member) => member.trial_ends_at && new Date(member.trial_ends_at) <= now
    ) || [];

    // Converted trials = expired trials that upgraded to paid SUCCESS+ membership
    const convertedTrials = expiredTrials.filter(
      (member) => member.membership_tier === 'SUCCESSPlus' && member.membership_status === 'Active'
    );

    // Calculate conversion rate
    const totalExpired = expiredTrials.length;
    const conversionRate = totalExpired > 0
      ? (convertedTrials.length / totalExpired) * 100
      : 0;

    // Format trial users for table
    const trialUsers = trialMembers?.map((member) => {
      const trialEndDate = member.trial_ends_at ? new Date(member.trial_ends_at) : null;
      const isExpired = trialEndDate ? trialEndDate <= now : true;
      const isConverted = member.membership_tier === 'SUCCESSPlus' && member.membership_status === 'Active';

      // Calculate days remaining
      let daysRemaining = 0;
      if (trialEndDate && !isExpired) {
        const diffTime = trialEndDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: member.id,
        name: `${member.first_name} ${member.last_name}`,
        email: member.email,
        trialStartedAt: member.trial_started_at,
        trialEndsAt: member.trial_ends_at,
        daysRemaining: isExpired ? 0 : daysRemaining,
        status: isConverted ? 'Converted' : isExpired ? 'Expired' : 'Active',
        membershipTier: member.membership_tier,
        membershipStatus: member.membership_status,
      };
    }) || [];

    const stats = {
      totalTrials: allTrials,
      activeTrials: activeTrials.length,
      expiredTrials: expiredTrials.length - convertedTrials.length, // Subtract converted from expired
      convertedTrials: convertedTrials.length,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      trialUsers,
    };

    return res.status(200).json(stats);

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
