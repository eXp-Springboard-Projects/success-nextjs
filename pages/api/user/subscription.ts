import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user with member data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', session.user.email!)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get member data
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('userId', user.id)
      .single();

    if (memberError || !member) {
      return res.status(404).json({ error: 'User or member not found' });
    }

    // Get active subscription
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('memberId', member.id)
      .in('status', ['ACTIVE', 'TRIALING', 'PAST_DUE'])
      .order('createdAt', { ascending: false })
      .limit(1);

    if (subscriptionError) {
      throw subscriptionError;
    }

    const subscription = subscriptions?.[0];

    if (!subscription) {
      return res.status(200).json({
        hasSubscription: false,
      });
    }

    return res.status(200).json({
      hasSubscription: true,
      status: subscription.status,
      tier: subscription.tier,
      billingCycle: subscription.billingCycle,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    });
  } catch (error) {
    console.error('Subscription API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
