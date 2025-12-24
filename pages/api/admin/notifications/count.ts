import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = supabaseAdmin();

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Count unread notifications for the user
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('userId', session.user.id)
        .eq('isRead', false);

      if (error) {
        console.error('Failed to count notifications:', error);
        return res.status(200).json({ count: 0, hasUnread: false });
      }

      return res.status(200).json({
        count: count || 0,
        hasUnread: (count || 0) > 0,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    return res.status(200).json({ count: 0, hasUnread: false });
  }
}
