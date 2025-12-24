import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { contentType, limit = '20', onlyInProgress } = req.query;

    let query = supabase
      .from('watch_history')
      .select('*')
      .eq('userId', session.user.id);

    // Filter by content type if provided
    if (contentType && (contentType === 'video' || contentType === 'podcast')) {
      query = query.eq('contentType', contentType);
    }

    // Filter for in-progress items only
    if (onlyInProgress === 'true') {
      query = query
        .eq('completed', false)
        .gt('position', 0);
    }

    const { data: watchHistory, error } = await query
      .order('lastWatchedAt', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) {
      throw error;
    }

    // Calculate progress percentage
    const historyWithProgress = (watchHistory || []).map((item) => ({
      ...item,
      progressPercent: item.duration && item.duration > 0
        ? Math.round((item.position / item.duration) * 100)
        : 0,
    }));

    return res.status(200).json({
      watchHistory: historyWithProgress,
      total: historyWithProgress.length,
    });
  } catch (error) {
    console.error('Watch history API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
