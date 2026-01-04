import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Check if user has admin role
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }

  if (req.method === 'GET') {
    const supabase = supabaseAdmin();

    try {
      // Fetch all members with subscriptions
      // FILTER: Only show members who have actually made purchases or subscriptions
      const { data: members, error } = await supabase
        .from('members')
        .select(`
          *,
          subscriptions(
            status,
            currentPeriodStart,
            currentPeriodEnd,
            stripePriceId,
            provider,
            tier,
            createdAt
          )
        `)
        .or('totalSpent.gt.0,membershipTier.neq.Free')
        .order('createdAt', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform data for frontend
      const transformedMembers = (members || []).map((member: any) => {
        // Sort subscriptions by createdAt and get the most recent
        const sortedSubscriptions = (member.subscriptions || []).sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const latestSubscription = sortedSubscriptions[0] || null;

        return {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`.trim(),
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.phone,
          membershipTier: member.membershipTier,
          membershipStatus: member.membershipStatus,
          totalSpent: member.totalSpent || 0,
          lifetimeValue: member.lifetimeValue || 0,
          createdAt: member.createdAt,
          joinDate: member.joinDate,
          subscription: latestSubscription,
          trialEndsAt: member.trialEndsAt,
          stripeCustomerId: member.stripeCustomerId,
          stripeSubscriptionId: latestSubscription?.id || null,
        };
      });

      return res.status(200).json({ members: transformedMembers });
    } catch (error: any) {
      console.error('Error fetching members:', error);
      return res.status(500).json({
        message: 'Failed to fetch members',
        error: error?.message || 'Unknown error',
        members: []
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
