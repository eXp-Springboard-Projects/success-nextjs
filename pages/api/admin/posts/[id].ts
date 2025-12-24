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

  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_authorId_fkey (
            id,
            name,
            email
          ),
          categories (*),
          tags (*)
        `)
        .eq('id', id as string)
        .single();

      if (error || !post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Format response similar to WordPress API
      const formattedPost = {
        id: post.id,
        title: { rendered: post.title },
        slug: post.slug,
        content: { rendered: post.content },
        excerpt: { rendered: post.excerpt || '' },
        status: post.status.toLowerCase(),
        date: post.publishedAt || post.createdAt,
        modified: post.updatedAt,
        featured_media_url: post.featuredImage || '',
        featuredImageAlt: post.featuredImageAlt || '',
        seoTitle: post.seoTitle || '',
        seoDescription: post.seoDescription || '',
        readTime: post.readTime || 0,
        _embedded: {
          author: [{
            id: post.users.id,
            name: post.users.name,
            email: post.users.email,
          }],
          'wp:term': [
            (post.categories || []).map((cat: any) => ({
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              taxonomy: 'category'
            })),
            (post.tags || []).map((tag: any) => ({
              id: tag.id,
              name: tag.name,
              slug: tag.slug,
              taxonomy: 'post_tag'
            }))
          ],
          'wp:featuredmedia': post.featuredImage ? [{
            source_url: post.featuredImage,
            alt_text: post.featuredImageAlt || '',
          }] : []
        },
        categories: (post.categories || []).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug
        })),
        tags: (post.tags || []).map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug
        }))
      };

      return res.status(200).json(formattedPost);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch post' });
    }
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const {
        title,
        slug,
        content,
        excerpt,
        status,
        featuredImage,
        featuredImageAlt,
        seoTitle,
        seoDescription,
        categories: categoryIds,
        tags: tagIds,
        publishedAt
      } = req.body;

      // Get current post
      const { data: currentPost } = await supabase
        .from('posts')
        .select('publishedAt')
        .eq('id', id as string)
        .single();

      const newStatus = status?.toUpperCase() || 'DRAFT';
      const isBeingPublished = newStatus === 'PUBLISHED' || newStatus === 'PUBLISH';

      const updateData: any = {
        title,
        slug,
        content,
        excerpt,
        status: newStatus,
        featuredImage,
        featuredImageAlt,
        seoTitle,
        seoDescription,
      };

      if (isBeingPublished) {
        updateData.publishedAt = publishedAt
          ? new Date(publishedAt).toISOString()
          : (currentPost?.publishedAt || new Date().toISOString());
      }

      const { data: updatedPost, error: updateError } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', id as string)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Create revision
      await supabase
        .from('post_revisions')
        .insert({
          id: `rev_${Date.now()}`,
          postId: updatedPost.id,
          title: updatedPost.title,
          content: updatedPost.content,
          excerpt: updatedPost.excerpt,
          featuredImage: updatedPost.featuredImage,
          featuredImageAlt: updatedPost.featuredImageAlt,
          status: updatedPost.status,
          seoTitle: updatedPost.seoTitle,
          seoDescription: updatedPost.seoDescription,
          authorId: session.user.id,
          authorName: session.user.name || 'Unknown',
          changeNote: 'Updated via admin editor',
        });

      return res.status(200).json({
        success: true,
        post: {
          id: updatedPost.id,
          title: updatedPost.title,
          slug: updatedPost.slug,
          status: updatedPost.status,
        }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update post' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id as string);

      if (error) {
        throw error;
      }

      return res.status(200).json({ success: true, message: 'Post deleted' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
