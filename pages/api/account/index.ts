import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = supabaseAdmin();

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get member and subscription
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    let subscription = null;
    if (member) {
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })
        .limit(1);

      subscription = subscriptions?.[0] || null;
    }

    // Get bookmarks count
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
      subscription,
      bookmarksCount: bookmarks?.length || 0,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch account data' });
  }
}
