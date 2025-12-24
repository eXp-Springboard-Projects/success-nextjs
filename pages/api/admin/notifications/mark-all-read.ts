import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = supabaseAdmin();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Mark all notifications as read for this user
    const { data, error, count } = await supabase
      .from('notifications')
      .update({
        isRead: true,
        readAt: new Date().toISOString(),
      })
      .eq('userId', session.user.id)
      .eq('isRead', false)
      .select();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      message: `Marked ${data?.length || 0} notifications as read`,
      count: data?.length || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
}
