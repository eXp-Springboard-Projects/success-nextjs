import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      return getCategory(req, res, id);
    case 'PUT':
      return updateCategory(req, res, id);
    case 'DELETE':
      return deleteCategory(req, res, id);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getCategory(req, res, id) {
  const supabase = supabaseAdmin();

  try {
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Get post count for this category
    const { count } = await supabase
      .from('post_categories')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    const categoryWithCount = {
      ...category,
      _count: {
        posts: count || 0,
      },
    };

    return res.status(200).json(categoryWithCount);
  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateCategory(req, res, id) {
  const supabase = supabaseAdmin();

  try {
    const { name, slug, description } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;

    const { data: category, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return res.status(500).json({ message: 'Failed to update category' });
    }

    return res.status(200).json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteCategory(req, res, id) {
  const supabase = supabaseAdmin();

  try {
    // Delete related post_categories records first (if not using CASCADE)
    await supabase
      .from('post_categories')
      .delete()
      .eq('category_id', id);

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return res.status(500).json({ message: 'Failed to delete category' });
    }

    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
