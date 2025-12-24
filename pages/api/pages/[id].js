import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      return getPage(req, res, id);
    case 'PUT':
      return updatePage(req, res, id);
    case 'DELETE':
      return deletePage(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getPage(req, res, id) {
  const supabase = supabaseAdmin();

  try {
    const { data: page, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    return res.status(200).json(page);
  } catch (error) {
    console.error('Error fetching page:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updatePage(req, res, id) {
  const supabase = supabaseAdmin();

  try {
    const { title, slug, content, status, seoTitle, seoDescription, publishedAt } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (slug) updateData.slug = slug;
    if (content) updateData.content = content;
    if (status) updateData.status = status;
    if (seoTitle !== undefined) updateData.seo_title = seoTitle;
    if (seoDescription !== undefined) updateData.seo_description = seoDescription;
    if (publishedAt) updateData.published_at = new Date(publishedAt).toISOString();

    const { data: page, error } = await supabase
      .from('pages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating page:', error);
      return res.status(500).json({ message: 'Failed to update page' });
    }

    return res.status(200).json(page);
  } catch (error) {
    console.error('Error updating page:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deletePage(req, res, id) {
  const supabase = supabaseAdmin();

  try {
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting page:', error);
      return res.status(500).json({ message: 'Failed to delete page' });
    }

    return res.status(200).json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
