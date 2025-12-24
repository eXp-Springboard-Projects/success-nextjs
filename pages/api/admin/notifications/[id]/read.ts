import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

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

  const { id } = req.query;

  try {
    // Mark notification as read
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({
        isRead: true,
        readAt: new Date().toISOString(),
      })
      .eq('id', id as string)
      .eq('userId', session.user.id) // Ensure user owns this notification
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json(notification);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark notification as read' });
  }
}
