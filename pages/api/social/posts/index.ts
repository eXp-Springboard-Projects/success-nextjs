/**
 * Social Posts API
 * GET /api/social/posts - List all posts (with filters)
 * POST /api/social/posts - Create a new post
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { supabaseAdmin } from '@/lib/supabase';
import { SocialPost, CreatePostRequest, ApiResponse, PaginatedResponse } from '@/types/social';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<SocialPost[] | SocialPost>>
) {
  const session = await getServerSession(req, res, {} as any);

  if (!session || !session.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const userId = session.user.id || session.user.email!;

  if (req.method === 'GET') {
    return handleGet(userId, req, res);
  }

  if (req.method === 'POST') {
    return handlePost(userId, req, res);
  }

  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleGet(
  userId: string,
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<SocialPost[]>>
) {
  try {
    const { status, platform, limit = '50' } = req.query;

    const db = supabaseAdmin();
    let query = db
      .from('social_posts')
      .select('*, results:social_post_results(*)')
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: false })
      .limit(parseInt(limit as string));

    // Apply filters
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    if (platform && typeof platform === 'string') {
      query = query.contains('target_platforms', [platform]);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: (data || []) as SocialPost[],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
}

async function handlePost(
  userId: string,
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<SocialPost>>
) {
  try {
    const postData: CreatePostRequest = req.body;

    // Validate required fields
    if (!postData.content || !postData.targetPlatforms || postData.targetPlatforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content and target platforms are required',
      });
    }

    const db = supabaseAdmin();

    const { data, error } = await db
      .from('social_posts')
      .insert({
        user_id: userId,
        content: postData.content,
        content_variants: postData.contentVariants || {},
        media_ids: postData.mediaIds || [],
        link_url: postData.linkUrl || null,
        scheduled_at: postData.scheduledAt,
        status: 'draft',
        target_platforms: postData.targetPlatforms,
        is_evergreen: postData.isEvergreen || false,
        evergreen_interval_days: postData.evergreenIntervalDays || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      data: data as SocialPost,
      message: 'Post created successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
}
