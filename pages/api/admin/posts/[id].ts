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
      // First, try to fetch from Supabase
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

      // If found in Supabase, return it
      if (post && !error) {
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
          contentType: post.contentType || 'regular',
          accessTier: post.accessTier || 'free',
          scheduledDate: post.scheduledFor || '',
          // New CMS fields from migration
          contentPillar: post.contentPillar || '',
          customAuthorId: post.customAuthorId || '',
          authorName: post.authorName || '',
          featureOnHomepage: post.featureOnHomepage || false,
          featureInPillar: post.featureInPillarSection || false,
          featureTrending: post.showInTrending || false,
          mainFeaturedArticle: post.mainFeaturedArticle || false,
          wordpressId: post.wordpressId || null,
          _embedded: {
            author: [{
              id: post.authorId,
              name: post.authorName || post.wordpressAuthor || post.users?.name || 'Unknown Author',
              email: post.users?.email || '',
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
      }

      // If not found in Supabase, try WordPress API
      const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://successcom.wpenginepowered.com/wp-json/wp/v2';

      try {
        const wpResponse = await fetch(`${WORDPRESS_API_URL}/posts/${id}?_embed`, {
          headers: {
            'User-Agent': 'SUCCESS-Next.js',
          },
        });

        if (wpResponse.ok) {
          const wpPost = await wpResponse.json();

          // Format WordPress post to match expected structure
          const formattedWpPost = {
            id: wpPost.id,
            title: wpPost.title,
            slug: wpPost.slug,
            content: wpPost.content,
            excerpt: wpPost.excerpt || { rendered: '' },
            status: wpPost.status,
            date: wpPost.date,
            modified: wpPost.modified,
            featured_media_url: wpPost._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
            featuredImageAlt: wpPost._embedded?.['wp:featuredmedia']?.[0]?.alt_text || '',
            seoTitle: wpPost.yoast_head_json?.title || '',
            seoDescription: wpPost.yoast_head_json?.description || '',
            readTime: 0,
            _embedded: wpPost._embedded || {},
            categories: wpPost._embedded?.['wp:term']?.[0] || [],
            tags: wpPost._embedded?.['wp:term']?.[1] || [],
            wordpressId: wpPost.id, // Mark as WordPress post
          };

          return res.status(200).json(formattedWpPost);
        }
      } catch (wpError) {
        console.error('WordPress API fetch failed:', wpError);
      }

      // Not found in either Supabase or WordPress
      return res.status(404).json({ error: 'Post not found' });
    } catch (error) {
      console.error('Error fetching post:', error);
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
        publishedAt,
        wordpressId
      } = req.body;

      // Get current post from Supabase
      const { data: currentPost } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id as string)
        .single();

      // If post doesn't exist in Supabase but has wordpressId, create a new local copy
      if (!currentPost && wordpressId) {
        const newStatus = status?.toUpperCase() || 'DRAFT';
        const isBeingPublished = newStatus === 'PUBLISHED' || newStatus === 'PUBLISH';

        const newPost: any = {
          id: id as string, // Use WordPress ID as the primary key
          title: title || 'Untitled',
          slug: slug || `post-${id}`,
          content: content || '',
          excerpt: excerpt || '',
          status: newStatus,
          featuredImage: featuredImage || null,
          featuredImageAlt: featuredImageAlt || null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          authorId: session.user.id,
          wordpressId: wordpressId,
          readTime: 0,
          views: 0,
          canonicalUrl: null,
          customExcerpt: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (isBeingPublished) {
          newPost.publishedAt = publishedAt
            ? new Date(publishedAt).toISOString()
            : new Date().toISOString();
        }

        const { data: createdPost, error: createError } = await supabase
          .from('posts')
          .insert(newPost)
          .select()
          .single();

        if (createError) {
          console.error('Failed to create local copy of WordPress post:', createError);
          throw createError;
        }

        // Create initial revision
        await supabase
          .from('post_revisions')
          .insert({
            id: `rev_${Date.now()}`,
            postId: createdPost.id,
            title: createdPost.title,
            content: createdPost.content,
            excerpt: createdPost.excerpt,
            featuredImage: createdPost.featuredImage,
            featuredImageAlt: createdPost.featuredImageAlt,
            status: createdPost.status,
            seoTitle: createdPost.seoTitle,
            seoDescription: createdPost.seoDescription,
            authorId: session.user.id,
            authorName: session.user.name || 'Unknown',
            changeNote: 'Created local copy from WordPress for editing',
          });

        return res.status(200).json({
          success: true,
          post: {
            id: createdPost.id,
            title: createdPost.title,
            slug: createdPost.slug,
            status: createdPost.status,
          }
        });
      }

      if (!currentPost) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const newStatus = status?.toUpperCase() || currentPost.status;
      const isBeingPublished = newStatus === 'PUBLISHED' || newStatus === 'PUBLISH';

      // For PATCH requests, only update fields that are provided
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (slug !== undefined) updateData.slug = slug;
      if (content !== undefined) updateData.content = content;
      if (excerpt !== undefined) updateData.excerpt = excerpt;
      if (status !== undefined) updateData.status = newStatus;
      if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
      if (featuredImageAlt !== undefined) updateData.featuredImageAlt = featuredImageAlt;
      if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
      if (seoDescription !== undefined) updateData.seoDescription = seoDescription;

      // New fields for content management
      if (req.body.contentPillar !== undefined) updateData.contentPillar = req.body.contentPillar;
      if (req.body.customAuthorId !== undefined) updateData.customAuthorId = req.body.customAuthorId;
      if (req.body.authorName !== undefined) updateData.authorName = req.body.authorName;
      if (req.body.featureOnHomepage !== undefined) updateData.featureOnHomepage = req.body.featureOnHomepage;
      if (req.body.featureInPillar !== undefined) updateData.featureInPillarSection = req.body.featureInPillar;
      if (req.body.featureTrending !== undefined) updateData.showInTrending = req.body.featureTrending;
      if (req.body.mainFeaturedArticle !== undefined) updateData.mainFeaturedArticle = req.body.mainFeaturedArticle;
      if (req.body.contentType !== undefined) updateData.contentType = req.body.contentType;
      if (req.body.accessTier !== undefined) updateData.accessTier = req.body.accessTier;
      if (req.body.scheduledDate !== undefined) updateData.scheduledFor = req.body.scheduledDate;

      // Track who updated the post
      updateData.updatedBy = session.user.id;

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
      console.error('Error updating post:', error);
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
