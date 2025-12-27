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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid page ID' });
  }

  if (req.method === 'GET') {
    try {
      const { data: page, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      return res.status(200).json(page);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const {
        title,
        slug,
        content,
        status,
        seoTitle,
        seoDescription,
        featuredImage,
        featuredImageAlt,
        template,
        parentId,
        order,
      } = req.body;

      // Check if slug is being changed and if it conflicts
      if (slug) {
        const { data: existing } = await supabase
          .from('pages')
          .select('id')
          .eq('slug', slug)
          .neq('id', id)
          .single();

        if (existing) {
          return res.status(409).json({ error: 'Page with this slug already exists' });
        }
      }

      // Get current page to check publishedAt
      const { data: currentPage } = await supabase
        .from('pages')
        .select('publishedAt')
        .eq('id', id)
        .single();

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (title !== undefined) updateData.title = title;
      if (slug !== undefined) updateData.slug = slug;
      if (content !== undefined) updateData.content = content;
      if (status !== undefined) {
        const newStatus = status.toUpperCase();
        updateData.status = newStatus;
        // Set publishedAt only if being published and it doesn't already have one
        if ((newStatus === 'PUBLISHED' || newStatus === 'PUBLISH') && !currentPage?.publishedAt) {
          updateData.publishedAt = new Date().toISOString();
        }
      }
      if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
      if (seoDescription !== undefined) updateData.seoDescription = seoDescription;
      if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
      if (featuredImageAlt !== undefined) updateData.featuredImageAlt = featuredImageAlt;
      if (template !== undefined) updateData.template = template;
      if (parentId !== undefined) updateData.parentId = parentId;
      if (order !== undefined) updateData.order = parseInt(order);

      const { data: page, error } = await supabase
        .from('pages')
        .update(updateData)
        .eq('id', id)
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
          action: 'UPDATE',
          entity: 'page',
          entityId: page.id,
          details: JSON.stringify({ title: page.title, slug: page.slug }),
        });

      return res.status(200).json(page);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          action: 'DELETE',
          entity: 'page',
          entityId: id,
        });

      return res.status(200).json({ message: 'Page deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
