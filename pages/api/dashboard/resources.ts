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

    const hasActiveSubscription = user.member?.subscriptions?.some((s: any) => s.status === 'ACTIVE');

    if (!hasActiveSubscription) {
      return res.status(403).json({ error: 'SUCCESS+ subscription required' });
    }

    if (req.method === 'GET') {
      const { category, search } = req.query;

      let query = supabase
        .from('resources')
        .select('*')
        .eq('isPremium', true);

      if (category && category !== 'all') {
        query = query.eq('category', category as string);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data: resources, error: resourcesError } = await query.order('createdAt', { ascending: false });

      if (resourcesError) {
        throw resourcesError;
      }

      return res.status(200).json(resources || []);
    }

    if (req.method === 'POST') {
      // Track resource download
      const { resourceId } = req.body;

      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID is required' });
      }

      // Get current downloads count
      const { data: currentResource, error: fetchError } = await supabase
        .from('resources')
        .select('downloads')
        .eq('id', resourceId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Increment download count
      const { data: resource, error: updateError } = await supabase
        .from('resources')
        .update({ downloads: (currentResource?.downloads || 0) + 1 })
        .eq('id', resourceId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return res.status(200).json(resource);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Dashboard resources error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
