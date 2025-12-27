/**
 * Manual Publish Post
 * POST /api/social/publish - Publish a post immediately
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { publishPost } from '@/lib/social/publisher';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, {} as any);

  if (!session || !session.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { postId } = req.body;

  if (!postId) {
    return res.status(400).json({ success: false, error: 'Post ID required' });
  }

  try {
    const userId = session.user.id || session.user.email!;

    // Verify user owns the post
    const db = supabaseAdmin();
    const { data: post } = await db
      .from('social_posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (!post || post.user_id !== userId) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Publish the post
    const result = await publishPost(postId);

    return res.status(200).json({
      success: result.success,
      data: result,
      message: result.success ? 'Post published successfully' : 'Post publishing failed',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
}
