import { NextApiRequest, NextApiResponse } from 'next';
import { fetchWordPressData } from '@/lib/wordpress';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { per_page = '20' } = req.query;

    console.log('[Posts API] Fetching posts that are already on the site');

    // Fetch posts from WordPress (these are already cached/rendered on the site via ISR)
    // The site pulls from WordPress during build/ISR, so this gets what's live on the site
    const wpPosts = await fetchWordPressData(`posts?_embed&per_page=${per_page}`);

    console.log('[Posts API] Got', wpPosts?.length || 0, 'posts');

    // Format WordPress posts - these are what's live on the site at /blog/[slug]
    const formattedPosts = (wpPosts || []).map((post: any) => ({
      ...post,
      type: 'posts',
      link: `/blog/${post.slug}`,
      source: 'site', // This is what's on your Next.js site
      editable: false,
    }));

    return res.status(200).json(formattedPosts);
  } catch (error) {
    console.error('[Posts API] Error fetching posts:', error);
    return res.status(500).json({ error: 'Failed to fetch posts', message: error instanceof Error ? error.message : 'Unknown error' });
  }
}
