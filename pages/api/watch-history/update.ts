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

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
      contentType,
      contentId,
      contentTitle,
      contentUrl,
      thumbnail,
      duration,
      position,
      completed,
    } = req.body;

    // Validate required fields
    if (!contentType || !contentId || !contentTitle || !contentUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (contentType !== 'video' && contentType !== 'podcast') {
      return res.status(400).json({ error: 'contentType must be either "video" or "podcast"' });
    }

    // Check if record exists
    const { data: existing } = await supabase
      .from('watch_history')
      .select('*')
      .eq('userId', session.user.id)
      .eq('contentType', contentType)
      .eq('contentId', contentId)
      .single();

    let watchHistory;

    if (existing) {
      // Update existing record
      const updateData: any = {
        position: position || 0,
        completed: completed || false,
        lastWatchedAt: new Date().toISOString(),
      };

      if (duration) updateData.duration = duration;
      if (thumbnail) updateData.thumbnail = thumbnail;

      const { data, error } = await supabase
        .from('watch_history')
        .update(updateData)
        .eq('userId', session.user.id)
        .eq('contentType', contentType)
        .eq('contentId', contentId)
        .select()
        .single();

      if (error) throw error;
      watchHistory = data;
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('watch_history')
        .insert({
          userId: session.user.id,
          contentType,
          contentId,
          contentTitle,
          contentUrl,
          thumbnail,
          duration,
          position: position || 0,
          completed: completed || false,
          lastWatchedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      watchHistory = data;
    }

    return res.status(200).json({
      message: 'Watch progress saved',
      watchHistory,
    });
  } catch (error) {
    console.error('Watch history update API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
