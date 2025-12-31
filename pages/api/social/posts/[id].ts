/**
 * Social Post API (Single)
 * GET /api/social/posts/[id] - Get one post
 * PUT /api/social/posts/[id] - Update post
 * DELETE /api/social/posts/[id] - Delete post
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { SocialPost, UpdatePostRequest, ApiResponse } from '@/types/social';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<SocialPost | null>>
) {
  const session: any = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const userId = session.user.id || session.user.email!;
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid post ID' });
  }

  if (req.method === 'GET') {
    return handleGet(userId, id, res);
  }

  if (req.method === 'PUT') {
    return handlePut(userId, id, req, res);
  }

  if (req.method === 'DELETE') {
    return handleDelete(userId, id, res);
  }

  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleGet(
  userId: string,
  id: string,
  res: NextApiResponse<ApiResponse<SocialPost | null>>
) {
  try {
    const db = supabaseAdmin();

    const { data, error } = await db
      .from('social_posts')
      .select('*, results:social_post_results(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: data as SocialPost,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      error: 'Post not found',
    });
  }
}

async function handlePut(
  userId: string,
  id: string,
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<SocialPost>>
) {
  try {
    const updates: UpdatePostRequest = req.body;
    const db = supabaseAdmin();

    // Verify ownership
    const { data: existing } = await db
      .from('social_posts')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Build update object (only include provided fields)
    const updateData: any = {};
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.contentVariants !== undefined) updateData.content_variants = updates.contentVariants;
    if (updates.mediaIds !== undefined) updateData.media_ids = updates.mediaIds;
    if (updates.linkUrl !== undefined) updateData.link_url = updates.linkUrl;
    if (updates.scheduledAt !== undefined) updateData.scheduled_at = updates.scheduledAt;
    if (updates.targetPlatforms !== undefined) updateData.target_platforms = updates.targetPlatforms;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.isEvergreen !== undefined) updateData.is_evergreen = updates.isEvergreen;
    if (updates.evergreenIntervalDays !== undefined) updateData.evergreen_interval_days = updates.evergreenIntervalDays;

    const { data, error } = await db
      .from('social_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: data as SocialPost,
      message: 'Post updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
}

async function handleDelete(
  userId: string,
  id: string,
  res: NextApiResponse<ApiResponse<null>>
) {
  try {
    const db = supabaseAdmin();

    // Verify ownership
    const { data: existing } = await db
      .from('social_posts')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const { error } = await db
      .from('social_posts')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: null,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
}
