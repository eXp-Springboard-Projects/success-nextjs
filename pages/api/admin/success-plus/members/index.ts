import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.email?.endsWith('@success.com')) {
    return res.status(401).json({ error: 'Unauthorized - Staff access only' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    // Fetch all members with SUCCESS+ tier or active subscriptions
    const { data: members, error } = await supabase
      .from('members')
      .select('id, firstName, lastName, email, membershipTier, membershipStatus, trialEndsAt, joinDate')
      .order('joinDate', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching members:', error);
      return res.status(500).json({ error: 'Failed to fetch members' });
    }

    return res.status(200).json({ members: members || [] });
  } catch (error: any) {
    console.error('Error in members API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
