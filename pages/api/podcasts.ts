import { NextApiRequest, NextApiResponse } from 'next';
import { fetchWordPressData } from '@/lib/wordpress';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { per_page = '20', status = 'all' } = req.query;

    // Build WordPress API endpoint for custom post type 'podcast'
    let endpoint = `podcast?_embed&per_page=${per_page}`;

    if (status !== 'all') {
      endpoint += `&status=${status}`;
    }

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
