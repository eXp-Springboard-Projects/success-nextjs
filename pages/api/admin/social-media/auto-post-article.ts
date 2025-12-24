import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';
import { generateSocialPostFromArticle } from '../../../../lib/social-media-poster';

/**
 * Auto-Post Article to Social Media
 *
 * Creates a social media post from a published article.
 * Can either queue for review or post immediately.
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { articleId, postImmediately = false, platforms } = req.body;

    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }

    const supabase = supabaseAdmin();

    // Get article details
    const { data: article, error: articleError } = await supabase
      .from('posts')
      .select('id, title, excerpt, slug, featuredImage')
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Generate post content
    const postContent = generateSocialPostFromArticle({
      title: article.title,
      excerpt: article.excerpt || undefined,
      slug: article.slug,
      featuredImage: article.featuredImage,
    });

    // Get user's active platforms if not specified
    let selectedPlatforms = platforms;

    if (!selectedPlatforms || selectedPlatforms.length === 0) {
      const { data: accounts, error: accountsError } = await supabase
        .from('social_accounts')
        .select('platform')
        .eq('user_id', session.user.id)
        .eq('is_active', true);

      if (!accountsError && accounts) {
        selectedPlatforms = [...new Set(accounts.map((a: any) => a.platform))];
      }
    }

    if (!selectedPlatforms || selectedPlatforms.length === 0) {
      return res.status(400).json({
        error: 'No active social media accounts found',
        message: 'Please connect your social media accounts first',
      });
    }

    // Create social media post
    const { data: post, error: postError } = await supabase
      .from('social_posts')
      .insert({
        user_id: session.user.id,
        article_id: articleId,
        content: postContent.content,
        image_url: postContent.imageUrl || null,
        link_url: postContent.linkUrl || null,
        platforms: selectedPlatforms,
        status: postImmediately ? 'POSTING' : 'DRAFT',
        auto_generated: true,
      })
      .select('id')
      .single();

    if (postError) throw postError;

    return res.status(201).json({
      success: true,
      postId: post.id,
      message: postImmediately
        ? 'Article is being posted to social media'
        : 'Social media post created and queued for review',
      postContent,
    });

  } catch (error: any) {
    console.error('Error creating auto-post:', error);
    return res.status(500).json({
      error: 'Failed to create social media post',
      message: error.message,
    });
  }
}
