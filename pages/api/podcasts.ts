import { NextApiRequest, NextApiResponse } from 'next';
import { fetchWordPressData } from '@/lib/wordpress';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { per_page = '20', page = '1', status = 'all', _embed } = req.query;

    // Build query parameters
    const params = new URLSearchParams({
      per_page: String(per_page),
      page: String(page),
    });

    if (_embed) {
      params.append('_embed', 'true');
    }

    if (status !== 'all') {
      params.append('status', String(status));
    }

    // Build WordPress API endpoint for custom post type 'podcast'
    const endpoint = `podcast?${params.toString()}`;

    try {
      const podcasts = await fetchWordPressData(endpoint);

      // Add type and link to each podcast
      const formattedPodcasts = (podcasts || []).map((podcast: any) => ({
        ...podcast,
        type: 'podcasts',
        link: `/podcast/${podcast.slug}`,
        source: 'wordpress',
        editable: false,
      }));

      return res.status(200).json(formattedPodcasts);
    } catch (wpError) {
      // If WordPress endpoint doesn't exist, return empty array
      console.log('WordPress podcasts endpoint not available, returning empty array');
      return res.status(200).json([]);
    }
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    return res.status(500).json({ error: 'Failed to fetch podcasts' });
  }
}
