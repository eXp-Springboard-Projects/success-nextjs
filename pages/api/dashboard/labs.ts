import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has SUCCESS+ subscription
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        member:members!inner (
          id,
          subscriptions (
            status
          )
        )
      `)
      .eq('email', session.user.email!)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hasActiveSubscription = (user as any).member?.subscriptions?.some((s: any) => s.status === 'ACTIVE');

    if (!hasActiveSubscription) {
      return res.status(403).json({ error: 'SUCCESS+ subscription required' });
    }

    if (req.method === 'GET') {
      const { category } = req.query;

      let query = supabase
        .from('success_labs')
        .select('*')
        .eq('isActive', true)
        .eq('isPremium', true);

      if (category && category !== 'all') {
        query = query.eq('category', category as string);
      }

      const { data: labs, error: labsError } = await query.order('order', { ascending: true });

      if (labsError) {
        throw labsError;
      }

      return res.status(200).json(labs || []);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Dashboard labs error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
