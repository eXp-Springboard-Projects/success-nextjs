import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = supabaseAdmin();

  if (req.method === 'GET') {
    const {
      category = 'all',
      search = '',
      featured = 'false'
    } = req.query;

    try {
      let query = supabase
        .from('resources')
        .select('*')
        .eq('isActive', true)
        .order('title', { ascending: true });

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      if (featured === 'true') {
        query = query.eq('featured', true);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data: resources, error } = await query;

      if (error) {
        throw error;
      }

      return res.status(200).json(resources || []);
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      return res.status(500).json({ error: 'Failed to fetch resources' });
    }
  }

  if (req.method === 'POST') {
    // Track download
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { resourceId } = req.body;

    try {
      // Use RPC function to increment download count
      const { error } = await supabase.rpc('increment_resource_downloads', {
        resource_id: resourceId,
      });

      if (error) {
        // If function doesn't exist, fall back to manual update
        const { data: resource } = await supabase
          .from('resources')
          .select('downloadCount')
          .eq('id', resourceId)
          .single();

        if (resource) {
          await supabase
            .from('resources')
            .update({ downloadCount: (resource.downloadCount || 0) + 1 })
            .eq('id', resourceId);
        }
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error tracking download:', error);
      return res.status(500).json({ error: 'Failed to track download' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
