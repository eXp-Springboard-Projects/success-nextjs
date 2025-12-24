import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getPosts(req, res);
    case 'POST':
      return createPost(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getPosts(req, res) {
  const supabase = supabaseAdmin();

  try {
    const {
      per_page = 10,
      page = 1,
      status = 'PUBLISHED',
      categories,
      search,
      _embed,
    } = req.query;

    const from = (parseInt(page) - 1) * parseInt(per_page);
    const to = from + parseInt(per_page) - 1;

    let query = supabase.from('posts').select(
      _embed === 'true' || _embed === '1'
        ? '*, users(id, name, bio, avatar), post_categories(categories(*)), post_tags(tags(*))'
        : '*',
      { count: 'exact' }
    );

    // Only filter by status if not 'all'
    if (status && status !== 'all') {
      query = query.eq('status', status.toUpperCase());
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // For categories, we'll need to filter differently due to many-to-many relationship
    // This is simplified - may need refinement based on schema

    query = query.order('publishedAt', { ascending: false }).range(from, to);

    const { data: posts, error: postsError, count: total } = await query;

    if (postsError) throw postsError;

    res.setHeader('X-WP-Total', total || 0);
    res.setHeader('X-WP-TotalPages', Math.ceil((total || 0) / parseInt(per_page)));

    // Transform to WordPress-like format
    const transformedPosts = (posts || []).map(post => ({
      id: post.id,
      date: post.publishedAt,
      modified: post.updatedAt,
      slug: post.slug,
      status: post.status?.toLowerCase() || 'draft',
      title: {
        rendered: post.title,
      },
      content: {
        rendered: post.content,
      },
      excerpt: {
        rendered: post.excerpt || '',
      },
      featured_media_url: post.featuredImage,
      _embedded: _embed ? {
        author: post.users ? [{
          id: post.users.id,
          name: post.users.name,
          description: post.users.bio || '',
          avatar_urls: {
            96: post.users.avatar || '',
          },
        }] : [],
        'wp:featuredmedia': post.featuredImage ? [{
          source_url: post.featuredImage,
          alt_text: post.featuredImageAlt || '',
        }] : [],
        'wp:term': [
          post.post_categories?.map(pc => pc.categories) || [],
          post.post_tags?.map(pt => pt.tags) || [],
        ],
      } : undefined,
    }));

    return res.status(200).json(transformedPosts);
  } catch (error) {
    console.error('Get posts error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function createPost(req, res) {
  const supabase = supabaseAdmin();

  try {
    const {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      featuredImageAlt,
      status = 'DRAFT',
      authorId,
      categories = [],
      tags = [],
      seoTitle,
      seoDescription,
    } = req.body;

    const { data: post, error: createError } = await supabase
      .from('posts')
      .insert({
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        featuredImageAlt,
        status: status.toUpperCase(),
        authorId,
        publishedAt: status.toUpperCase() === 'PUBLISHED' ? new Date().toISOString() : null,
        seoTitle,
        seoDescription,
      })
      .select()
      .single();

    if (createError) throw createError;

    // Insert category relationships
    if (categories.length > 0) {
      const categoryInserts = categories.map(catId => ({
        postId: post.id,
        categoryId: catId,
      }));
      await supabase.from('post_categories').insert(categoryInserts);
    }

    // Insert tag relationships
    if (tags.length > 0) {
      const tagInserts = tags.map(tagId => ({
        postId: post.id,
        tagId,
      }));
      await supabase.from('post_tags').insert(tagInserts);
    }

    return res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
