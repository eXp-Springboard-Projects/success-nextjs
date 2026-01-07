import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'Anthropic API key not configured'
    });
  }

  const { limit = 10, contentPillar, onlyMissing = true } = req.body;
  const supabase = supabaseAdmin();

  try {
    // Build query for posts needing excerpts
    let query = supabase
      .from('posts')
      .select('id, title, content, excerpt, contentPillar');

    if (onlyMissing) {
      query = query.or('excerpt.is.null,excerpt.eq.');
    }

    if (contentPillar) {
      query = query.eq('contentPillar', contentPillar);
    }

    query = query.limit(limit);

    const { data: posts, error: fetchError } = await query;

    if (fetchError) {
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }

    if (!posts || posts.length === 0) {
      return res.status(200).json({
        message: 'No posts need excerpts',
        processed: 0,
        results: []
      });
    }

    // Generate excerpts with rate limiting
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const post of posts) {
      try {
        // Clean HTML from content
        const cleanContent = post.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const contentPreview = cleanContent.substring(0, 1500);

        const prompt = `Based on this article, write a compelling 1-2 sentence excerpt (20-40 words) that summarizes the main point and hooks the reader.

Title: ${post.title}

Article Content: ${contentPreview}${cleanContent.length > 1500 ? '...' : ''}

Write ONLY the excerpt, no preamble or explanation.`;

        const response = await fetch(ANTHROPIC_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 150,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (!response.ok) {
          errorCount++;
          results.push({
            postId: post.id,
            title: post.title,
            success: false,
            error: 'API request failed'
          });
          continue;
        }

        const data = await response.json();
        const generatedExcerpt = data.content[0].text.trim();

        // Update the post
        const { error: updateError } = await supabase
          .from('posts')
          .update({
            excerpt: generatedExcerpt,
            excerptGeneratedBy: 'ai',
            excerptGeneratedAt: new Date().toISOString(),
          })
          .eq('id', post.id);

        if (updateError) {
          errorCount++;
          results.push({
            postId: post.id,
            title: post.title,
            success: false,
            error: 'Failed to save excerpt'
          });
        } else {
          successCount++;
          results.push({
            postId: post.id,
            title: post.title,
            success: true,
            excerpt: generatedExcerpt
          });
        }

        // Rate limiting: wait 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        errorCount++;
        results.push({
          postId: post.id,
          title: post.title,
          success: false,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      processed: posts.length,
      successful: successCount,
      failed: errorCount,
      results
    });

  } catch (error: any) {
    console.error('Error in bulk excerpt generation:', error);
    return res.status(500).json({
      error: 'Bulk generation failed',
      message: error.message
    });
  }
}
