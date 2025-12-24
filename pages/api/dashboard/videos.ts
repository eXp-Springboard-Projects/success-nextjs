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
      // Get all published videos
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('status', 'PUBLISHED')
        .order('publishedAt', { ascending: false });

      if (videosError) {
        throw videosError;
      }

      return res.status(200).json(videos || []);
    }

    if (req.method === 'POST') {
      // Update watch progress
      const { videoId, progress, completed } = req.body;

      if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required' });
      }

      // Check if video exists
      const { data: video, error: videoError } = await supabase
        .from('videos')
        .select('id, status')
        .eq('id', videoId)
        .single();

      if (videoError || !video || video.status !== 'PUBLISHED') {
        return res.status(404).json({ error: 'Video not found' });
      }

      // Watch history tracking not yet implemented
      return res.status(200).json({ message: 'Watch history tracking not available' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Dashboard videos error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
