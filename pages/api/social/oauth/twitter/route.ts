/**
 * Twitter OAuth Initiation
 * GET /api/social/oauth/twitter - Redirect to Twitter authorization
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { buildTwitterAuthUrl } from '@/lib/social/platforms/twitter';
import { generateOAuthState } from '@/lib/social/encryption';
import { createHash, randomBytes } from 'crypto';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, {} as any);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate state and code verifier for PKCE
    const state = generateOAuthState();
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Store state and code verifier in session/cookie
    // For production, use encrypted HTTP-only cookies or session storage
    res.setHeader('Set-Cookie', [
      `twitter_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      `twitter_code_verifier=${codeVerifier}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    ]);

    // Build authorization URL
    const authUrl = buildTwitterAuthUrl(state, codeChallenge);

    return res.redirect(authUrl);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}
