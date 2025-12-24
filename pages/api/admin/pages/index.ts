import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = supabaseAdmin();

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      const {
        per_page = '20',
        page = '1',
        status = 'all',
        search,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(per_page as string);
      const take = parseInt(per_page as string);

      // Build query
      let query = supabase
        .from('pages')
        .select('*', { count: 'exact' });

      // Apply filters
      if (status && status !== 'all') {
        query = query.eq('status', status.toString().toUpperCase());
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      // Execute query with pagination
      const { data: pages, error, count } = await query
        .order('createdAt', { ascending: false })
        .range(skip, skip + take - 1);

      if (error) {
        throw error;
      }

      res.setHeader('X-Total-Count', (count || 0).toString());
      res.setHeader('X-Total-Pages', Math.ceil((count || 0) / take).toString());

      return res.status(200).json(pages || []);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        title,
        slug,
        content,
        status = 'DRAFT',
        seoTitle,
        seoDescription,
        featuredImage,
        featuredImageAlt,
        template,
        parentId,
        order = 0,
      } = req.body;

      if (!title || !slug || !content) {
        return res.status(400).json({ error: 'Title, slug, and content are required' });
      }

      // Check for duplicate slug
      const { data: existing, error: existingError } = await supabase
        .from('pages')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        return res.status(409).json({ error: 'Page with this slug already exists' });
      }

      const { data: page, error } = await supabase
        .from('pages')
        .insert({
          id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title,
          slug,
          content,
          status: status.toUpperCase(),
          publishedAt: status.toUpperCase() === 'PUBLISHED' ? new Date().toISOString() : null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          featuredImage: featuredImage || null,
          featuredImageAlt: featuredImageAlt || null,
          template: template || null,
          parentId: parentId || null,
          order: parseInt(order),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          action: 'CREATE',
          entity: 'page',
          entityId: page.id,
          details: JSON.stringify({ title: page.title, slug: page.slug }),
        });

      return res.status(201).json(page);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
