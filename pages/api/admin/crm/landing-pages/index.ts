import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return getLandingPages(req, res);
  } else if (req.method === 'POST') {
    return createLandingPage(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getLandingPages(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const query = req.query;
    const status = (query.status as string) || '';
    const page = parseInt((query.page as string) || '1');
    const limit = parseInt((query.limit as string) || '50');
    const offset = (page - 1) * limit;

    let queryBuilder = supabase
      .from('landing_pages')
      .select('id, title, slug, status, template, views, conversions, published_at, created_by, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    const { data: pages, error, count } = await queryBuilder;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch landing pages' });
    }

    // Add conversion_rate calculation
    const pagesWithRate = pages?.map(p => ({
      ...p,
      conversion_rate: p.views > 0 ? (p.conversions / p.views * 100) : 0,
    }));

    return res.status(200).json({
      pages: pagesWithRate,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch landing pages' });
  }
}

async function createLandingPage(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
    const {
      title,
      slug,
      content,
      metaTitle,
      metaDescription,
      template,
      formId,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const pageId = nanoid();
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const { data: page, error } = await supabase
      .from('landing_pages')
      .insert({
        id: pageId,
        title,
        slug: finalSlug,
        content: content || [],
        meta_title: metaTitle || title,
        meta_description: metaDescription || null,
        template: template || 'minimal',
        form_id: formId || null,
        created_by: session.user.email,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Slug already exists' });
      }
      return res.status(500).json({ error: 'Failed to create landing page' });
    }

    return res.status(201).json(page);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create landing page' });
  }
}
