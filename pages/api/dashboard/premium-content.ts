import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';
import { checkTrialAccess } from '../../../lib/checkTrialAccess';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if user has active subscription or trial
    const accessResult = await checkTrialAccess(session.user.email!);

    if (!accessResult.hasAccess) {
      if (accessResult.reason === 'trial_expired') {
        return res.status(403).json({
          error: 'Your trial has expired',
          trialExpired: true,
          upgradeUrl: '/upgrade',
        });
      }
      return res.status(403).json({ error: 'SUCCESS+ subscription required' });
    }

    // Find the user for bookmarks
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email!)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { category, limit = '20', offset = '0' } = req.query;

    // Get premium posts (posts in SUCCESS+ category)
    // First get posts with premium categories
    const { data: premiumCategories } = await supabase
      .from('categories')
      .select('id')
      .in('slug', ['success-plus', 'insider', 'premium']);

    if (!premiumCategories || premiumCategories.length === 0) {
      return res.status(200).json({
        posts: [],
        total: 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: false,
      });
    }

    const premiumCategoryIds = premiumCategories.map((c: any) => c.id);

    // Build query for posts with premium categories
    let postsQuery = supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        featuredImage,
        featuredImageAlt,
        publishedAt,
        updatedAt,
        readTime,
        wordpressId,
        post_categories!inner (
          categories (
            id,
            name,
            slug,
            color
          )
        ),
        post_tags (
          tags (
            id,
            name,
            slug
          )
        )
      `, { count: 'exact' })
      .eq('status', 'PUBLISHED')
      .in('post_categories.categoryId', premiumCategoryIds)
      .order('publishedAt', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    const { data: posts, error: postsError, count: totalCount } = await postsQuery;

    if (postsError) {
      throw postsError;
    }

    // Get user's bookmarked posts
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('articleId')
      .eq('userId', user.id);

    const bookmarkedIds = new Set((bookmarks || []).map((b: any) => b.articleId));

    // Format posts for frontend
    const formattedPosts = (posts || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content?.substring(0, 200) + '...',
      featuredImage: post.featuredImage,
      featuredImageAlt: post.featuredImageAlt,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      readTime: post.readTime,
      wordpressId: post.wordpressId,
      isPremium: true, // All posts in this query are premium
      categories: post.post_categories?.map((pc: any) => pc.categories).filter(Boolean) || [],
      tags: post.post_tags?.map((pt: any) => pt.tags).filter(Boolean) || [],
      isBookmarked: bookmarkedIds.has(post.id),
    }));

    return res.status(200).json({
      posts: formattedPosts,
      total: totalCount || 0,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: parseInt(offset as string) + formattedPosts.length < (totalCount || 0),
    });
  } catch (error) {
    console.error('Dashboard premium content error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
