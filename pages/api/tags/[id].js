import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      return getTag(req, res, id);
    case 'PUT':
      return updateTag(req, res, id);
    case 'DELETE':
      return deleteTag(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getTag(req, res, id) {
  const supabase = supabaseAdmin();

  try {
    const { data: tag, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    // Get post count for this tag
    const { count } = await supabase
      .from('post_tags')
      .select('*', { count: 'exact', head: true })
      .eq('tag_id', id);

    const tagWithCount = {
      ...tag,
      _count: {
        posts: count || 0,
      },
    };

    return res.status(200).json(tagWithCount);
  } catch (error) {
    console.error('Error fetching tag:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateTag(req, res, id) {
  const supabase = supabaseAdmin();

  try {
    const { name, slug } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;

    const { data: tag, error } = await supabase
      .from('tags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tag:', error);
      return res.status(500).json({ message: 'Failed to update tag' });
    }

    return res.status(200).json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteTag(req, res, id) {
  const supabase = supabaseAdmin();

  try {
    // Delete related post_tags records first (if not using CASCADE)
    await supabase
      .from('post_tags')
      .delete()
      .eq('tag_id', id);

    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting tag:', error);
      return res.status(500).json({ message: 'Failed to delete tag' });
    }

    return res.status(200).json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
