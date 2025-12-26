import { NextApiRequest, NextApiResponse } from 'next';
import { fetchWordPressData } from '@/lib/wordpress';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { per_page = '20', status = 'all' } = req.query;
    const limit = parseInt(per_page as string);

    // Fetch from BOTH sources in parallel
    const [wpPages, localPages] = await Promise.all([
      // WordPress pages
      fetchWordPressData(`pages?_embed&per_page=${per_page}${status !== 'all' ? `&status=${status}` : ''}`).catch(() => []),

      // Local Supabase pages
      (async () => {
        try {
          const supabase = supabaseAdmin();
          let query = supabase
            .from('pages')
            .select('*')
            .order('updatedAt', { ascending: false })
            .limit(limit);

          if (status !== 'all') {
            query = query.eq('status', status.toString().toUpperCase());
          }

          const { data } = await query;
          return data || [];
        } catch (e) {
          return [];
        }
      })()
    ]);

    // Format WordPress pages (external source) - filter out admin pages
    const formattedWpPages = (wpPages || [])
      .filter((page: any) => !page.slug?.startsWith('admin'))
      .map((page: any) => ({
        ...page,
        type: 'pages',
        link: `/${page.slug}`,
        source: 'wordpress',
        editable: false,
      }));

    // Format local pages (editable)
    const formattedLocalPages = (localPages || []).map((page: any) => ({
      id: page.id,
      title: { rendered: page.title },
      slug: page.slug,
      content: { rendered: page.content },
      status: page.status?.toLowerCase() || 'draft',
      date: page.publishedAt || page.createdAt,
      modified: page.updatedAt,
      type: 'pages',
      link: `/${page.slug}`,
      source: 'local',
      editable: true,
      _embedded: {
        'wp:featuredmedia': page.featuredImage ? [{
          source_url: page.featuredImage,
          alt_text: page.featuredImageAlt || ''
        }] : []
      }
    }));

    // Combine and sort by date
    const allPages = [...formattedWpPages, ...formattedLocalPages].sort((a, b) => {
      const dateA = new Date(a.date || a.modified || 0).getTime();
      const dateB = new Date(b.date || b.modified || 0).getTime();
      return dateB - dateA;
    });

    return res.status(200).json(allPages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return res.status(500).json({ error: 'Failed to fetch pages' });
  }
}
