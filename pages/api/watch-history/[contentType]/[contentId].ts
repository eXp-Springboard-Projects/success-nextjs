import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { contentType, contentId } = req.query;

    if (!contentType || !contentId) {
      return res.status(400).json({ error: 'Missing contentType or contentId' });
    }

    if (contentType !== 'video' && contentType !== 'podcast') {
      return res.status(400).json({ error: 'contentType must be either "video" or "podcast"' });
    }

    if (req.method === 'GET') {
      // Get watch history for specific content
      const { data: watchHistory, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('userId', session.user.id)
        .eq('contentType', contentType as string)
        .eq('contentId', contentId as string)
        .single();

      if (error || !watchHistory) {
        return res.status(404).json({ error: 'Watch history not found' });
      }

      // Calculate progress percentage
      const progressPercent = watchHistory.duration && watchHistory.duration > 0
        ? Math.round((watchHistory.position / watchHistory.duration) * 100)
        : 0;

      return res.status(200).json({
        ...watchHistory,
        progressPercent,
      });
    }

    if (req.method === 'DELETE') {
      // Delete watch history
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('userId', session.user.id)
        .eq('contentType', contentType as string)
        .eq('contentId', contentId as string);

      if (error) {
        console.error('Error deleting watch history:', error);
        return res.status(500).json({ error: 'Failed to delete watch history' });
      }

      return res.status(200).json({
        message: 'Watch history deleted',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Watch history item API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
