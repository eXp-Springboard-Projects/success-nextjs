import { NextApiRequest, NextApiResponse } from 'next';
import { fetchWordPressData } from '@/lib/wordpress';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { per_page = '20', status = 'all' } = req.query;

    // Build WordPress API endpoint for custom post type 'video'
    let endpoint = `video?_embed&per_page=${per_page}`;

    if (status !== 'all') {
      endpoint += `&status=${status}`;
    }

    const videos = await fetchWordPressData(endpoint);

    // Add type and link to each video
    const formattedVideos = (videos || []).map((video: any) => ({
      ...video,
      type: 'videos',
      link: `/video/${video.slug}`,
    }));

    return res.status(200).json(formattedVideos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return res.status(500).json({ error: 'Failed to fetch videos' });
  }
}
