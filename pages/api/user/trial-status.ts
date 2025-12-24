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

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, trialEndsAt')
      .eq('email', session.user.email!)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get member data
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('membershipTier, membershipStatus, trialEndsAt, trialStartedAt')
      .eq('userId', user.id)
      .single();

    // Member data is optional, so we don't throw error if not found
    const trialEndsAt = user.trialEndsAt || member?.trialEndsAt;
    const membershipTier = member?.membershipTier || 'Free';

    // Calculate if trial is active
    const isTrialActive =
      trialEndsAt &&
      new Date(trialEndsAt) > new Date();

    // Calculate days remaining
    let daysRemaining = 0;
    if (isTrialActive && trialEndsAt) {
      const now = new Date();
      const endDate = new Date(trialEndsAt);
      const diffTime = endDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return res.status(200).json({
      isTrialActive,
      trialEndsAt,
      daysRemaining,
      membershipTier,
      membershipStatus: member?.membershipStatus || 'Inactive',
    });
  } catch (error) {
    console.error('Trial status API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
