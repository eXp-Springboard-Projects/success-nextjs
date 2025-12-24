import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = supabaseAdmin();

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Get all notifications for the current user
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('userId', session.user.id)
        .order('priority', { ascending: false }) // URGENT first
        .order('createdAt', { ascending: false })
        .limit(100); // Limit to last 100 notifications

      if (error) {
        throw error;
      }

      return res.status(200).json(notifications || []);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  }

  if (req.method === 'POST') {
    try {
      // Create a new notification (admin only)
      if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const { userId, type, title, message, actionUrl, icon, priority, metadata, expiresAt } =
        req.body;

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          type,
          title,
          message,
          actionUrl,
          icon,
          priority: priority || 'NORMAL',
          metadata,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(201).json(notification);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to create notification' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
