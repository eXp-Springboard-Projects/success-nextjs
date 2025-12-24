import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

import { createPortalSession } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = supabaseAdmin();
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user and member info
    const { data: user } = await supabase
      .from('users')
      .select(`
        *,
        members!users_memberId_fkey(
          stripeCustomerId,
          subscriptions!subscriptions_memberId_fkey(*)
        )
      `)
      .eq('email', session.user.email!)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const member = user.members;

    if (!member?.stripeCustomerId) {
      return res.status(400).json({
        error: 'No Stripe customer found',
        message: 'You need to have an active subscription to access the billing portal',
      });
    }

    // Create portal session
    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success-plus/account`;

    const portalSession = await createPortalSession(
      member.stripeCustomerId,
      returnUrl
    );

    return res.status(200).json({
      url: portalSession.url,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to create portal session',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
