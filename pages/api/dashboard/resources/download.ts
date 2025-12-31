import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { resourceId } = req.body;

    if (!resourceId) {
      return res.status(400).json({ message: 'Resource ID required' });
    }

    const supabase = supabaseAdmin();

    // Increment download count
    const { error } = await supabase.rpc('increment_resource_downloads', {
      resource_id: resourceId,
    });

    if (error) {
      // If function doesn't exist, fall back to manual update
      const { data: resource } = await supabase
        .from('resources')
        .select('downloads')
        .eq('id', resourceId)
        .single();

      if (resource) {
        await supabase
          .from('resources')
          .update({ downloads: (resource.downloads || 0) + 1 })
          .eq('id', resourceId);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error tracking download:', error);
    return res.status(500).json({ message: 'Failed to track download' });
  }
}
