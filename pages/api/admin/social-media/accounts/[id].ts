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

  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      const supabase = supabaseAdmin();

      // Delete social media account
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', id as string)
        .eq('user_id', session.user.id);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error deleting social account:', error);
      return res.status(500).json({ error: 'Failed to delete account' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
