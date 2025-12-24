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

  if (req.method === 'GET') {
    try {
      const {
        page = '1',
        per_page = '100',
        status = 'all',
        search = '',
        author = 'all',
        category = 'all'
      } = req.query;

      const pageNum = parseInt(page as string);
      const perPage = parseInt(per_page as string);
      const skip = (pageNum - 1) * perPage;

      // Build query
      let query = supabase
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
        `, { count: 'exact' });

      // Apply filters
      if (status !== 'all') {
        query = query.eq('status', status.toString().toUpperCase());
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      if (author !== 'all') {
        query = query.eq('authorId', author);
      }

      // Note: Category filtering with many-to-many requires a different approach
      // For now, we'll fetch all and filter in memory if category is specified

      // Execute query
      const { data: posts, error, count } = await query
        .order('createdAt', { ascending: false })
        .range(skip, skip + perPage - 1);

      if (error) {
        throw error;
      }

      // Format response similar to WordPress API
      const formattedPosts = (posts || []).map(post => ({
        id: post.id,
        title: { rendered: post.title },
        slug: post.slug,
        content: { rendered: post.content },
        excerpt: { rendered: post.excerpt || '' },
        status: post.status.toLowerCase(),
        date: post.publishedAt || post.createdAt,
        modified: post.updatedAt,
        featured_media: post.featuredImage ? {
          source_url: post.featuredImage,
          alt_text: post.featuredImageAlt || '',
        } : null,
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
          ]
        }
      }));

      // Add pagination headers
      res.setHeader('X-WP-Total', (count || 0).toString());
      res.setHeader('X-WP-TotalPages', Math.ceil((count || 0) / perPage).toString());

      return res.status(200).json(formattedPosts);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }

  if (req.method === 'POST') {
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
        authorId,
        publishedAt
      } = req.body;

      // Create new post
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({
          id: `post_${Date.now()}`,
          title,
          slug,
          content,
          excerpt: excerpt || '',
          status: status?.toUpperCase() || 'DRAFT',
          featuredImage,
          featuredImageAlt,
          seoTitle,
          seoDescription,
          authorId: authorId || session.user.id,
          publishedAt: status === 'PUBLISHED' || status === 'published'
            ? (publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString())
            : null,
        })
        .select()
        .single();

      if (postError) {
        throw postError;
      }

      // Create initial revision
      await supabase
        .from('post_revisions')
        .insert({
          id: `rev_${Date.now()}`,
          postId: newPost.id,
          title: newPost.title,
          content: newPost.content,
          excerpt: newPost.excerpt,
          featuredImage: newPost.featuredImage,
          featuredImageAlt: newPost.featuredImageAlt,
          status: newPost.status,
          seoTitle: newPost.seoTitle,
          seoDescription: newPost.seoDescription,
          authorId: session.user.id,
          authorName: session.user.name || 'Unknown',
          changeNote: 'Initial version',
        });

      return res.status(201).json({
        success: true,
        id: newPost.id,
        post: {
          id: newPost.id,
          title: newPost.title,
          slug: newPost.slug,
          status: newPost.status,
        }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
