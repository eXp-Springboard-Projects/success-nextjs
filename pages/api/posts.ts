import { NextApiRequest, NextApiResponse } from 'next';
import { fetchWordPressData } from '@/lib/wordpress';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { per_page = '20', page = '1', _embed } = req.query;

    console.log('[Posts API] Fetching posts page', page, 'per_page', per_page);

    // Build query parameters
    const params = new URLSearchParams({
      per_page: String(per_page),
      page: String(page),
    });

    if (_embed) {
      params.append('_embed', 'true');
    }

    // Fetch posts from WordPress (these are already cached/rendered on the site via ISR)
    // The site pulls from WordPress during build/ISR, so this gets what's live on the site
    const wpPosts = await fetchWordPressData(`posts?${params.toString()}`);

    console.log('[Posts API] Got', wpPosts?.length || 0, 'posts for page', page);

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
