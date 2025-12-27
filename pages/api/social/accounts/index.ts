/**
 * Social Accounts API
 * GET /api/social/accounts - List all connected accounts
 * POST /api/social/accounts - Connect a new account (handled by OAuth callback)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { supabaseAdmin } from '@/lib/supabase';
import { SocialAccount, ApiResponse } from '@/types/social';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<SocialAccount[]>>
) {
  const session = await getServerSession(req, res, {} as any);

  if (!session || !session.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const userId = session.user.id || session.user.email!;

  if (req.method === 'GET') {
    return handleGet(userId, res);
  }

  res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleGet(
  userId: string,
  res: NextApiResponse<ApiResponse<SocialAccount[]>>
) {
  try {
    const db = supabaseAdmin();

    const { data, error } = await db
      .from('social_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Don't send encrypted tokens to client
    const sanitized = (data || []).map((account: any) => ({
      ...account,
      accessToken: '[ENCRYPTED]',
      refreshToken: '[ENCRYPTED]',
    }));

    return res.status(200).json({
      success: true,
      data: sanitized as SocialAccount[],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
}
