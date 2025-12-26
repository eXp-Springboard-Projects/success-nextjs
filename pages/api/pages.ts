import { NextApiRequest, NextApiResponse } from 'next';
import { fetchWordPressData } from '@/lib/wordpress';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { per_page = '20' } = req.query;

    // Fetch pages from WordPress
    const wpPages = await fetchWordPressData(`pages?_embed&per_page=${per_page}`);

    // Format WordPress pages - filter out admin pages
    const formattedPages = (wpPages || [])
      .filter((page: any) => !page.slug?.startsWith('admin'))
      .map((page: any) => ({
        ...page,
        type: 'pages',
        link: `/${page.slug}`,
        source: 'wordpress',
        editable: false,
      }));

    return res.status(200).json(formattedPages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    // Return empty array instead of error
    return res.status(200).json([]);
  }
}
