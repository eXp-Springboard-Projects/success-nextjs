import { NextApiRequest, NextApiResponse } from 'next';
import { fetchWordPressData } from '@/lib/wordpress';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { per_page = '20', page = '1', _embed } = req.query;

    console.log(`[Pages API] Fetching pages page ${page} with per_page=${per_page}`);

    // Build query parameters
    const params = new URLSearchParams({
      per_page: String(per_page),
      page: String(page),
    });

    if (_embed) {
      params.append('_embed', 'true');
    }

    // Fetch pages from WordPress
    const wpPages = await fetchWordPressData(`pages?${params.toString()}`);

    console.log(`[Pages API] Received ${wpPages?.length || 0} pages from WordPress for page ${page}`);

    // Format WordPress pages - filter out admin pages
    // These pages are what's live on your Next.js site at /[slug]
    const formattedPages = (wpPages || [])
      .filter((page: any) => {
        const isAdmin = page.slug?.startsWith('admin');
        if (isAdmin) {
          console.log(`[Pages API] Filtering out admin page: ${page.slug}`);
        }
        return !isAdmin;
      })
      .map((page: any) => ({
        ...page,
        type: 'pages',
        link: `/${page.slug}`,
        source: 'site', // This is what's on your Next.js site
        editable: false,
      }));

    console.log(`[Pages API] Returning ${formattedPages.length} pages after filtering`);

    return res.status(200).json(formattedPages);
  } catch (error) {
    console.error('[Pages API] Error fetching pages:', error);
    console.error('[Pages API] Error details:', error instanceof Error ? error.message : error);
    // Return empty array but log the error for debugging
    return res.status(200).json([]);
  }
}
