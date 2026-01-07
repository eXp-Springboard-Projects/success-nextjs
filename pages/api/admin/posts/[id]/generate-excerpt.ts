import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

// Anthropic API for excerpt generation
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

  if (!session || !['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'Anthropic API key not configured',
      message: 'Please set ANTHROPIC_API_KEY in environment variables'
    });
  }

  const { id } = req.query;
  const supabase = supabaseAdmin();

  try {
    // Get the post
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, title, content, excerpt')
      .eq('id', id as string)
      .single();

    if (fetchError || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Don't regenerate if excerpt already exists (unless forced)
    const { force } = req.body;
    if (post.excerpt && !force) {
      return res.status(200).json({
        excerpt: post.excerpt,
        alreadyExists: true,
        message: 'Excerpt already exists. Use force=true to regenerate.'
      });
    }

    // Clean HTML from content for analysis
    const cleanContent = post.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const contentPreview = cleanContent.substring(0, 1500); // First 1500 chars

    // Call Anthropic API to generate excerpt
    const prompt = `Based on this article, write a compelling 1-2 sentence excerpt (20-40 words) that summarizes the main point and hooks the reader. This is called a "dek" in journalism and appears between the headline and article body.

Title: ${post.title}

Article Content: ${contentPreview}${cleanContent.length > 1500 ? '...' : ''}

Write ONLY the excerpt/dek, no preamble or explanation. Make it engaging and informative.`;

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
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(500).json({
        error: 'Failed to generate excerpt',
        details: errorData
      });
    }

    const data = await response.json();
    const generatedExcerpt = data.content[0].text.trim();

    // Update the post with the generated excerpt
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        excerpt: generatedExcerpt,
        excerptGeneratedBy: 'ai',
        excerptGeneratedAt: new Date().toISOString(),
      })
      .eq('id', id as string);

    if (updateError) {
      console.error('Error updating post with excerpt:', updateError);
      return res.status(500).json({ error: 'Failed to save excerpt' });
    }

    return res.status(200).json({
      excerpt: generatedExcerpt,
      generated: true,
      tokensUsed: data.usage?.output_tokens || 0,
    });

  } catch (error: any) {
    console.error('Error generating excerpt:', error);
    return res.status(500).json({
      error: 'Failed to generate excerpt',
      message: error.message
    });
  }
}
