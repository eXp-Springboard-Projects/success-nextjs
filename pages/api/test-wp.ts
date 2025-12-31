import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL;

    console.log('[Test WP] Starting WordPress API test');
    console.log('[Test WP] WORDPRESS_API_URL:', WORDPRESS_API_URL ? 'SET' : 'NOT SET');

    if (!WORDPRESS_API_URL) {
      return res.status(500).json({
        error: 'WORDPRESS_API_URL environment variable is not set',
        env: process.env
      });
    }

    const url = `${WORDPRESS_API_URL}/posts?per_page=5`;
    console.log('[Test WP] Fetching from:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SUCCESS-Next.js-Test',
      },
    });

    console.log('[Test WP] Response status:', response.status);
    console.log('[Test WP] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      return res.status(response.status).json({
        error: `WordPress API returned ${response.status}`,
        url,
      });
    }

    const data = await response.json();
    console.log('[Test WP] Got', data.length, 'posts');

    return res.status(200).json({
      success: true,
      wpApiUrl: WORDPRESS_API_URL,
      postCount: data.length,
      firstPost: data[0]?.title?.rendered || 'No title',
    });
  } catch (error) {
    console.error('[Test WP] Error:', error);
    return res.status(500).json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
