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
      // Get all published magazines with user's reading progress
      const { data: magazines, error: magazinesError } = await supabase
        .from('magazines')
        .select('*')
        .eq('status', 'PUBLISHED')
        .order('publishedText', { ascending: false });

      if (magazinesError) {
        throw magazinesError;
      }

      const magazinesWithProgress = await Promise.all(
        (magazines || []).map(async (magazine: any) => {
          const { data: progress } = await supabase
            .from('magazine_progress')
            .select('*')
            .eq('userId', user.id)
            .eq('magazineId', magazine.id)
            .single();

          return {
            ...magazine,
            currentPage: progress?.currentPage || 1,
            totalPages: progress?.totalPages || 100,
            completed: progress?.completed || false,
            lastReadAt: progress?.lastReadAt || null,
          };
        })
      );

      return res.status(200).json(magazinesWithProgress);
    }

    if (req.method === 'POST') {
      // Update reading progress
      const { magazineId, currentPage, totalPages, completed } = req.body;

      if (!magazineId) {
        return res.status(400).json({ error: 'Magazine ID is required' });
      }

      // Check if progress exists
      const { data: existingProgress } = await supabase
        .from('magazine_progress')
        .select('*')
        .eq('userId', user.id)
        .eq('magazineId', magazineId)
        .single();

      let progress;
      if (existingProgress) {
        // Update existing progress
        const { data, error } = await supabase
          .from('magazine_progress')
          .update({
            currentPage: currentPage || 1,
            totalPages: totalPages || 100,
            completed: completed || false,
            lastReadAt: new Date().toISOString(),
          })
          .eq('userId', user.id)
          .eq('magazineId', magazineId)
          .select()
          .single();

        if (error) throw error;
        progress = data;
      } else {
        // Create new progress
        const { data, error } = await supabase
          .from('magazine_progress')
          .insert({
            userId: user.id,
            magazineId,
            currentPage: currentPage || 1,
            totalPages: totalPages || 100,
            completed: completed || false,
            lastReadAt: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        progress = data;
      }

      return res.status(200).json(progress);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Dashboard magazines error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
