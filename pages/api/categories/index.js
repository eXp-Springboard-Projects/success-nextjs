import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getCategories(req, res);
    case 'POST':
      return createCategory(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getCategories(req, res) {
  const supabase = supabaseAdmin();

  try {
    const {
      per_page = 50,
      page = 1,
      search,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(per_page);
    const limit = parseInt(per_page);

    let query = supabase
      .from('categories')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data: categories, error, count } = await query;

    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ message: 'Failed to fetch categories' });
    }

    // Get post counts for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (cat) => {
        const { count: postCount } = await supabase
          .from('post_categories')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id);

        return {
          id: cat.id,
          count: postCount || 0,
          description: cat.description || '',
          name: cat.name,
          slug: cat.slug,
        };
      })
    );

    res.setHeader('X-WP-Total', count || 0);
    res.setHeader('X-WP-TotalPages', Math.ceil((count || 0) / limit));

    return res.status(200).json(categoriesWithCounts);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function createCategory(req, res) {
  const supabase = supabaseAdmin();

  try {
    const { name, slug, description } = req.body;

    const categoryData = {
      name,
      slug,
      description,
    };

    const { data: category, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return res.status(500).json({ message: 'Failed to create category' });
    }

    return res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
