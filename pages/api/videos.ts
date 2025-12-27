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

    // Build WordPress API endpoint for custom post type 'video'
    const endpoint = `video?${params.toString()}`;

    try {
      const videos = await fetchWordPressData(endpoint);

      // Add type and link to each video
      const formattedVideos = (videos || []).map((video: any) => ({
        ...video,
        type: 'videos',
        link: `/video/${video.slug}`,
        source: 'wordpress',
        editable: false,
      }));

      return res.status(200).json(formattedVideos);
    } catch (wpError) {
      // If WordPress endpoint doesn't exist, return empty array
      console.log('WordPress videos endpoint not available, returning empty array');
      return res.status(200).json([]);
    }
  } catch (error) {
    console.error('Error fetching videos:', error);
    return res.status(500).json({ error: 'Failed to fetch videos' });
  }
}
