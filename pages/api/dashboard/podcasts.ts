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
      // Get all published podcasts
      const { data: podcasts, error: podcastsError } = await supabase
        .from('podcasts')
        .select('*')
        .eq('status', 'PUBLISHED')
        .order('publishedAt', { ascending: false });

      if (podcastsError) {
        throw podcastsError;
      }

      return res.status(200).json(podcasts || []);
    }

    if (req.method === 'POST') {
      // Update listen progress
      const { podcastId, progress, completed } = req.body;

      if (!podcastId) {
        return res.status(400).json({ error: 'Podcast ID is required' });
      }

      // Check if podcast exists
      const { data: podcast, error: podcastError } = await supabase
        .from('podcasts')
        .select('id, status')
        .eq('id', podcastId)
        .single();

      if (podcastError || !podcast || podcast.status !== 'PUBLISHED') {
        return res.status(404).json({ error: 'Podcast not found' });
      }

      // Listen history tracking not yet implemented
      return res.status(200).json({ message: 'Listen history tracking not available' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Dashboard podcasts error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
