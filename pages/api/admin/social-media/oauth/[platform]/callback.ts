import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../../lib/prisma';

/**
 * OAuth Callback Endpoint
 *
 * Handles the OAuth callback and exchanges the code for access tokens.
 */

const TOKEN_URLS = {
  twitter: 'https://api.twitter.com/2/oauth2/token',
  linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
  facebook: 'https://graph.facebook.com/v18.0/oauth/access_token',
  instagram: 'https://graph.facebook.com/v18.0/oauth/access_token',
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code, state, error, error_description, platform } = req.query;

  if (error) {
    return res.redirect(`/admin/social-media?error=${encodeURIComponent(error_description as string || error as string)}`);
  }

  if (!code || !state) {
    return res.redirect('/admin/social-media?error=Missing authorization code');
  }

  try {
    // Decode state
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const { userId, platform: statePlatform } = stateData;

    const platformKey = (platform || statePlatform) as string;

    // Get client credentials
    const clientId = process.env[`${platformKey.toUpperCase()}_CLIENT_ID`];
    const clientSecret = process.env[`${platformKey.toUpperCase()}_CLIENT_SECRET`] ||
                        process.env[`${platformKey.toUpperCase()}_APP_SECRET`];

    if (!clientId || !clientSecret) {
      throw new Error('OAuth credentials not configured');
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/admin/social-media/oauth/${platformKey}/callback`;

    // Exchange code for access token
    const tokenUrl = TOKEN_URLS[platformKey as keyof typeof TOKEN_URLS];
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code as string,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(errorData.error_description || 'Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get account info
    let accountName = 'Unknown';
    let accountId = 'unknown';

    if (platformKey === 'twitter') {
      const userResponse = await fetch('https://api.twitter.com/2/users/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const userData = await userResponse.json();
      accountName = userData.data?.username || 'Unknown';
      accountId = userData.data?.id || 'unknown';
    } else if (platformKey === 'linkedin') {
      const userResponse = await fetch('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const userData = await userResponse.json();
      accountName = `${userData.localizedFirstName} ${userData.localizedLastName}`;
      accountId = userData.id;
    } else if (platformKey === 'facebook' || platformKey === 'instagram') {
      const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${access_token}`);
      const userData = await userResponse.json();
      accountName = userData.name || 'Unknown';
      accountId = userData.id;
    }

    // Calculate token expiry
    const tokenExpiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000)
      : null;

    // Save to database
    await prisma.$executeRaw`
      INSERT INTO social_accounts (
        id, user_id, platform, account_name, account_id,
        access_token, refresh_token, token_expires_at,
        is_active, created_at, updated_at
      ) VALUES (
        gen_random_uuid()::TEXT,
        ${userId},
        ${platformKey},
        ${accountName},
        ${accountId},
        ${access_token},
        ${refresh_token || null},
        ${tokenExpiresAt}::TIMESTAMP,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id, platform, account_id)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expires_at = EXCLUDED.token_expires_at,
        is_active = true,
        last_error = NULL,
        updated_at = CURRENT_TIMESTAMP
    `;

    return res.redirect('/admin/social-media?success=Account connected successfully');
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return res.redirect(`/admin/social-media?error=${encodeURIComponent(error.message)}`);
  }
}
