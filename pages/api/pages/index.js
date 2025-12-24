import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getPages(req, res);
    case 'POST':
      return createPage(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getPages(req, res) {
  const supabase = supabaseAdmin();

  try {
    const {
      per_page = 50,
      page = 1,
      status,
      search,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(per_page);
    const limit = parseInt(per_page);

    let query = supabase
      .from('pages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status.toUpperCase());
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: pages, error, count } = await query;

    if (error) {
      console.error('Error fetching pages:', error);
      return res.status(500).json({ message: 'Failed to fetch pages' });
    }

    res.setHeader('X-WP-Total', count || 0);
    res.setHeader('X-WP-TotalPages', Math.ceil((count || 0) / limit));

    return res.status(200).json(pages || []);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function createPage(req, res) {
  const supabase = supabaseAdmin();

  try {
    const { title, slug, content, status, seoTitle, seoDescription, publishedAt } = req.body;

    const pageData = {
      title,
      slug,
      content,
      status: status || 'DRAFT',
      seo_title: seoTitle,
      seo_description: seoDescription,
      published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
    };

    const { data: page, error } = await supabase
      .from('pages')
      .insert([pageData])
      .select()
      .single();

    if (error) {
      console.error('Error creating page:', error);
      return res.status(500).json({ message: 'Failed to create page' });
    }

    return res.status(201).json(page);
  } catch (error) {
    console.error('Error creating page:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
