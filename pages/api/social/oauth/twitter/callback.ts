/**
 * Twitter OAuth Callback
 * GET /api/social/oauth/twitter/callback
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { supabaseAdmin } from '@/lib/supabase';
import { exchangeCodeForTokens, getTwitterUserInfo } from '@/lib/social/platforms/twitter';
import { verifyOAuthState } from '@/lib/social/encryption';
import { parse } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, {} as any);

  if (!session || !session.user) {
    return res.redirect('/admin/login?error=unauthorized');
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state } = req.query;

  if (typeof code !== 'string' || typeof state !== 'string') {
    return res.redirect('/admin/social-media/accounts?error=invalid_callback');
  }

  try {
    // Verify state
    const cookies = parse(req.headers.cookie || '');
    const expectedState = cookies.twitter_oauth_state;
    const codeVerifier = cookies.twitter_code_verifier;

    if (!expectedState || !verifyOAuthState(state, expectedState)) {
      throw new Error('Invalid OAuth state');
    }

    if (!codeVerifier) {
      throw new Error('Missing code verifier');
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier);

    // Get user info
    const userInfo = await getTwitterUserInfo(tokens.accessToken);

    // Save to database
    const db = supabaseAdmin();
    const userId = session.user.id || session.user.email!;

    await db.from('social_accounts').upsert(
      {
        user_id: userId,
        platform: 'twitter',
        platform_user_id: userInfo.id,
        platform_username: userInfo.username,
        platform_display_name: userInfo.name,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken || null,
        token_expires_at: tokens.expiresAt?.toISOString() || null,
        profile_image_url: userInfo.profileImageUrl,
        is_active: true,
      },
      {
        onConflict: 'user_id,platform,platform_user_id',
      }
    );

    // Clear OAuth cookies
    res.setHeader('Set-Cookie', [
      'twitter_oauth_state=; Path=/; HttpOnly; Max-Age=0',
      'twitter_code_verifier=; Path=/; HttpOnly; Max-Age=0',
    ]);

    return res.redirect('/admin/social-media/accounts?connected=twitter');
  } catch (error) {
    console.error('Twitter OAuth error:', error);
    return res.redirect(
      `/admin/social-media/accounts?error=${encodeURIComponent((error as Error).message)}`
    );
  }
}
