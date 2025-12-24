import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid landing page ID' });
  }

  if (req.method === 'GET') {
    return getLandingPage(id, res);
  } else if (req.method === 'PATCH') {
    return updateLandingPage(id, req, res);
  } else if (req.method === 'DELETE') {
    return deleteLandingPage(id, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getLandingPage(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();

    const { data: page, error } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !page) {
      return res.status(404).json({ error: 'Landing page not found' });
    }

    return res.status(200).json(page);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch landing page' });
  }
}

async function updateLandingPage(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const {
      title,
      slug,
      content,
      metaTitle,
      metaDescription,
      status,
      template,
      formId,
    } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (metaTitle !== undefined) updateData.meta_title = metaTitle;
    if (metaDescription !== undefined) updateData.meta_description = metaDescription;
    if (status !== undefined) updateData.status = status;
    if (template !== undefined) updateData.template = template;
    if (formId !== undefined) updateData.form_id = formId;

    if (status === 'published' && updateData.status) {
      updateData.published_at = new Date().toISOString();
    }

    updateData.updated_at = new Date().toISOString();

    const { data: page, error } = await supabase
      .from('landing_pages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Slug already exists' });
      }
      return res.status(500).json({ error: 'Failed to update landing page' });
    }

    return res.status(200).json(page);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update landing page' });
  }
}

async function deleteLandingPage(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from('landing_pages')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete landing page' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete landing page' });
  }
}
