import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';
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

    // Get article details
    const articles = await prisma.posts.findMany({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        excerpt: true,
        slug: true,
        featuredImage: true,
      },
      take: 1,
    });

    if (!articles || articles.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = articles[0];

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
      const accounts = await prisma.$queryRaw<Array<{ platform: string }>>`
        SELECT DISTINCT platform
        FROM social_accounts
        WHERE user_id = ${session.user.id}
          AND is_active = true
      `;

      selectedPlatforms = accounts.map((a: any) => a.platform);
    }

    if (selectedPlatforms.length === 0) {
      return res.status(400).json({
        error: 'No active social media accounts found',
        message: 'Please connect your social media accounts first',
      });
    }

    // Create social media post
    const result = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO social_posts (
        id, user_id, article_id, content, image_url, link_url,
        platforms, status, auto_generated, created_at, updated_at
      ) VALUES (
        gen_random_uuid()::TEXT,
        ${session.user.id},
        ${articleId},
        ${postContent.content},
        ${postContent.imageUrl || null},
        ${postContent.linkUrl || null},
        ARRAY[${selectedPlatforms.join(',')}]::TEXT[],
        ${postImmediately ? 'POSTING' : 'DRAFT'}::TEXT,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING id
    `;

    const postId = result[0]?.id;

    return res.status(201).json({
      success: true,
      postId,
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
