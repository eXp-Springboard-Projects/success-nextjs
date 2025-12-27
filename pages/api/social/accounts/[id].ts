/**
 * Social Account API (Single)
 * GET /api/social/accounts/[id] - Get one account
 * DELETE /api/social/accounts/[id] - Disconnect account
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { supabaseAdmin } from '@/lib/supabase';
import { SocialAccount, ApiResponse } from '@/types/social';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<SocialAccount | null>>
) {
  const session = await getServerSession(req, res, {} as any);

  if (!session || !session.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const userId = session.user.id || session.user.email!;
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid account ID' });
  }

  if (req.method === 'GET') {
    return handleGet(userId, id, res);
  }

  if (req.method === 'DELETE') {
    return handleDelete(userId, id, res);
  }

  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleGet(
  userId: string,
  id: string,
  res: NextApiResponse<ApiResponse<SocialAccount | null>>
) {
  try {
    const db = supabaseAdmin();

    const { data, error } = await db
      .from('social_accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    // Sanitize tokens
    const sanitized = data ? {
      ...data,
      accessToken: '[ENCRYPTED]',
      refreshToken: '[ENCRYPTED]',
    } : null;

    return res.status(200).json({
      success: true,
      data: sanitized as SocialAccount,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      error: 'Account not found',
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
    const { data: account } = await db
      .from('social_accounts')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    // Delete account (cascade will delete related post results)
    const { error } = await db
      .from('social_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: null,
      message: 'Account disconnected successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
}
