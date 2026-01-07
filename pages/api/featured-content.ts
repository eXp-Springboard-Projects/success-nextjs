import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';
import { fetchWordPressData } from '../../lib/wordpress';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();

  try {
    // Fetch placements from database
    const { data: placements, error } = await supabase
      .from('homepage_placements')
      .select('*')
      .eq('active', true)
      .order('zone')
      .order('position');

    if (error) {
      // Table might not exist yet, return empty
      return res.status(200).json({
        hero: [],
        secondary: [],
        trending: [],
      });
    }

    // Group placements by zone
    const zones: Record<string, any[]> = {
      hero: [],
      secondary: [],
      trending: [],
    };

    // Fetch posts for each placement
    for (const placement of placements || []) {
      try {
        // Try fetching from WordPress API
        const post = await fetchWordPressData(`posts/${placement.postId}?_embed`);

        if (post && zones[placement.zone]) {
          zones[placement.zone].push(post);
        }
      } catch (error) {
        console.error(`Failed to fetch post ${placement.postId}:`, error);
      }
    }

    return res.status(200).json(zones);
  } catch (error: any) {
    console.error('Error fetching featured content:', error);
    return res.status(500).json({
      error: 'Failed to fetch featured content',
      message: error.message,
    });
  }
}
