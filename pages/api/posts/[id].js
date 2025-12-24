import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      return getPost(id, req, res);
    case 'PUT':
      return updatePost(id, req, res);
    case 'DELETE':
      return deletePost(id, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getPost(id, req, res) {
  const supabase = supabaseAdmin();

  try {
    const { _embed } = req.query;

    let query = supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    const { data: post, error } = await query;

    if (error || !post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // If _embed is requested, fetch related data
    let author = null;
    let categories = [];
    let tags = [];

    if (_embed === 'true' || _embed === '1') {
      // Fetch author
      if (post.author_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, bio, avatar')
          .eq('id', post.author_id)
          .single();
        author = userData;
      }

      // Fetch categories via junction table
      const { data: postCategories } = await supabase
        .from('post_categories')
        .select('category_id, categories(id, name, slug, description)')
        .eq('post_id', id);

      if (postCategories) {
        categories = postCategories.map(pc => pc.categories);
      }

      // Fetch tags via junction table
      const { data: postTags } = await supabase
        .from('post_tags')
        .select('tag_id, tags(id, name, slug)')
        .eq('post_id', id);

      if (postTags) {
        tags = postTags.map(pt => pt.tags);
      }
    }

    // Transform to WordPress-like format
    const transformedPost = {
      id: post.id,
      date: post.published_at,
      modified: post.updated_at,
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
      featured_media_url: post.featured_image,
      _embedded: _embed ? {
        author: author ? [{
          id: author.id,
          name: author.name,
          description: author.bio || '',
          avatar_urls: {
            96: author.avatar || '',
          },
        }] : [],
        'wp:featuredmedia': post.featured_image ? [{
          source_url: post.featured_image,
          alt_text: post.featured_image_alt || '',
        }] : [],
        'wp:term': [
          categories || [],
          tags || [],
        ],
      } : undefined,
    };

    return res.status(200).json(transformedPost);
  } catch (error) {
    console.error('Error fetching post:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updatePost(id, req, res) {
  const supabase = supabaseAdmin();

  try {
    const {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      featuredImageAlt,
      status,
      categories,
      tags,
      seoTitle,
      seoDescription,
    } = req.body;

    const updateData = {};

    if (title) updateData.title = title;
    if (slug) updateData.slug = slug;
    if (content) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (featuredImage !== undefined) updateData.featured_image = featuredImage;
    if (featuredImageAlt !== undefined) updateData.featured_image_alt = featuredImageAlt;
    if (status) updateData.status = status.toUpperCase();
    if (seoTitle !== undefined) updateData.seo_title = seoTitle;
    if (seoDescription !== undefined) updateData.seo_description = seoDescription;

    if (status && status.toUpperCase() === 'PUBLISHED') {
      updateData.published_at = new Date().toISOString();
    }

    // Update the post
    const { data: post, error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating post:', updateError);
      return res.status(500).json({ message: 'Failed to update post' });
    }

    // Handle categories update
    if (categories) {
      // Delete existing categories
      await supabase
        .from('post_categories')
        .delete()
        .eq('post_id', id);

      // Insert new categories
      if (categories.length > 0) {
        const categoryRecords = categories.map(catId => ({
          post_id: id,
          category_id: catId,
        }));
        await supabase
          .from('post_categories')
          .insert(categoryRecords);
      }
    }

    // Handle tags update
    if (tags) {
      // Delete existing tags
      await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', id);

      // Insert new tags
      if (tags.length > 0) {
        const tagRecords = tags.map(tagId => ({
          post_id: id,
          tag_id: tagId,
        }));
        await supabase
          .from('post_tags')
          .insert(tagRecords);
      }
    }

    // Fetch updated post with relations
    const { data: updatedPost } = await supabase
      .from('posts')
      .select(`
        *,
        users:author_id(id, name, bio, avatar),
        post_categories(categories(id, name, slug)),
        post_tags(tags(id, name, slug))
      `)
      .eq('id', id)
      .single();

    return res.status(200).json(updatedPost || post);
  } catch (error) {
    console.error('Error updating post:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deletePost(id, res) {
  const supabase = supabaseAdmin();

  try {
    // Delete related records first (if not using CASCADE)
    await supabase.from('post_categories').delete().eq('post_id', id);
    await supabase.from('post_tags').delete().eq('post_id', id);

    // Delete the post
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting post:', error);
      return res.status(500).json({ message: 'Failed to delete post' });
    }

    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
