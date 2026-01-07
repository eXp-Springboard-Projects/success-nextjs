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
        // Convert WordPress-style status to database enum
        const dbStatus = status.toString() === 'publish' ? 'PUBLISHED' : status.toString().toUpperCase();
        query = query.eq('status', dbStatus);
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
      const formattedPosts = (posts || []).map(post => {
        // Handle author data - could be from join or separate query
        const authorData = post.users || null;
        const author = authorData ? {
          id: authorData.id || post.authorId,
          name: authorData.name || 'Unknown Author',
          email: authorData.email || '',
        } : {
          id: post.authorId,
          name: 'Unknown Author',
          email: '',
        };

        return {
          id: post.id,
          title: { rendered: post.title },
          slug: post.slug,
          content: { rendered: post.content },
          excerpt: { rendered: post.excerpt || '' },
          status: post.status === 'PUBLISHED' ? 'publish' : post.status.toLowerCase(),
          date: post.publishedAt || post.createdAt,
          modified: post.updatedAt,
          featured_media: post.featuredImage ? {
            source_url: post.featuredImage,
            alt_text: post.featuredImageAlt || '',
          } : null,
          _embedded: {
            author: [author],
            'wp:author': [author], // Add both for compatibility
            'wp:featuredmedia': post.featuredImage ? [{
              source_url: post.featuredImage,
              alt_text: post.featuredImageAlt || '',
            }] : [],
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
        };
      });

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
        publishedAt,
        contentPillar,
        customAuthorId,
        featureOnHomepage,
        featureInPillar,
        featureTrending,
        mainFeaturedArticle,
      } = req.body;

      // Create new post (only include fields that exist in the database)
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({
          id: `post_${Date.now()}`,
          title,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          content,
          excerpt: excerpt || '',
          status: status?.toUpperCase() || 'DRAFT',
          featuredImage: featuredImage || null,
          featuredImageAlt: featuredImageAlt || null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          authorId: authorId || session.user.id,
          publishedAt: status === 'PUBLISHED' || status === 'published'
            ? (publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString())
            : null,
          contentPillar: contentPillar || null,
          customAuthorId: customAuthorId || null,
          featureOnHomepage: featureOnHomepage || false,
          featureInPillar: featureInPillar || false,
          featureTrending: featureTrending || false,
          mainFeaturedArticle: mainFeaturedArticle || false,
        })
        .select()
        .single();

      if (postError) {
        console.error('Post creation error:', postError);
        return res.status(500).json({
          error: 'Failed to create post',
          message: postError.message,
          details: postError.details,
          hint: postError.hint
        });
      }

      // Create initial revision (don't fail if this doesn't work)
      try {
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
      } catch (revError: any) {
        console.error('Failed to create revision (non-fatal):', revError.message);
        // Continue anyway - revision is not critical
      }

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
    } catch (error: any) {
      console.error('Post creation error:', error);
      return res.status(500).json({
        error: 'Failed to create post',
        message: error.message || 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
