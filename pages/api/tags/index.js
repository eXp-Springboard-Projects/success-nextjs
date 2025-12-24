import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getTags(req, res);
    case 'POST':
      return createTag(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getTags(req, res) {
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
      .from('tags')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data: tags, error, count } = await query;

    if (error) {
      console.error('Error fetching tags:', error);
      return res.status(500).json({ message: 'Failed to fetch tags' });
    }

    // Get post counts for each tag
    const tagsWithCounts = await Promise.all(
      (tags || []).map(async (tag) => {
        const { count: postCount } = await supabase
          .from('post_tags')
          .select('*', { count: 'exact', head: true })
          .eq('tag_id', tag.id);

        return {
          id: tag.id,
          count: postCount || 0,
          name: tag.name,
          slug: tag.slug,
          _count: {
            posts: postCount || 0,
          },
        };
      })
    );

    res.setHeader('X-WP-Total', count || 0);
    res.setHeader('X-WP-TotalPages', Math.ceil((count || 0) / limit));

    return res.status(200).json(tagsWithCounts);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function createTag(req, res) {
  const supabase = supabaseAdmin();

  try {
    const { name, slug } = req.body;

    const tagData = {
      name,
      slug,
    };

    const { data: tag, error } = await supabase
      .from('tags')
      .insert([tagData])
      .select()
      .single();

    if (error) {
      console.error('Error creating tag:', error);
      return res.status(500).json({ message: 'Failed to create tag' });
    }

    return res.status(201).json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
