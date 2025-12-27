/**
 * LinkedIn OAuth Initiation
 * GET /api/social/oauth/linkedin - Redirect to LinkedIn authorization
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { buildLinkedInAuthUrl } from '@/lib/social/platforms/linkedin';
import { generateOAuthState } from '@/lib/social/encryption';

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
    // Generate state for CSRF protection
    const state = generateOAuthState();

    // Store state in cookie
    res.setHeader(
      'Set-Cookie',
      `linkedin_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    );

    // Build authorization URL
    const authUrl = buildLinkedInAuthUrl(state);

    return res.redirect(authUrl);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}
