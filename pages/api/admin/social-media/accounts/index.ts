import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const supabase = supabaseAdmin();

      // Get all social media accounts for the user
      const { data: accounts, error } = await supabase
        .from('social_accounts')
        .select('id, user_id, platform, account_name, account_id, is_active, token_expires_at, last_error, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ accounts: accounts || [] });
    } catch (error: any) {
      console.error('Error fetching social accounts:', error);
      return res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
