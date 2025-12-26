import { NextApiRequest, NextApiResponse } from 'next';
import { fetchWordPressData } from '@/lib/wordpress';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { per_page = '20' } = req.query;

    // Fetch posts from WordPress
    const wpPosts = await fetchWordPressData(`posts?_embed&per_page=${per_page}`);

    // Format WordPress posts
    const formattedPosts = (wpPosts || []).map((post: any) => ({
      ...post,
      type: 'posts',
      link: `/blog/${post.slug}`,
      source: 'wordpress',
      editable: false,
    }));

    return res.status(200).json(formattedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ error: 'Failed to fetch posts', message: error instanceof Error ? error.message : 'Unknown error' });
  }
}
