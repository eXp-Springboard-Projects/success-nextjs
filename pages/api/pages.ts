import { NextApiRequest, NextApiResponse } from 'next';
import { fetchWordPressData } from '@/lib/wordpress';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { per_page = '20' } = req.query;

    console.log(`[Pages API] Fetching pages with per_page=${per_page}`);

    // Fetch pages from WordPress
    const wpPages = await fetchWordPressData(`pages?_embed&per_page=${per_page}`);

    console.log(`[Pages API] Received ${wpPages?.length || 0} pages from WordPress`);

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
