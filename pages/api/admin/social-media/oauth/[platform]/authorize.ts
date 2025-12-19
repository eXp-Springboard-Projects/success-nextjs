import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]';

/**
 * OAuth Authorization Endpoint
 *
 * This endpoint initiates the OAuth flow for connecting social media accounts.
 *
 * Required Environment Variables:
 * - TWITTER_CLIENT_ID
 * - TWITTER_CLIENT_SECRET
 * - LINKEDIN_CLIENT_ID
 * - LINKEDIN_CLIENT_SECRET
 * - FACEBOOK_APP_ID
 * - FACEBOOK_APP_SECRET
 * - INSTAGRAM_APP_ID (uses Facebook Graph API)
 * - INSTAGRAM_APP_SECRET
 * - YOUTUBE_CLIENT_ID (Google OAuth)
 * - YOUTUBE_CLIENT_SECRET
 * - TIKTOK_CLIENT_KEY
 * - TIKTOK_CLIENT_SECRET
 *
 * OAuth Redirect URI: /api/admin/social-media/oauth/[platform]/callback
 */

const OAUTH_CONFIGS = {
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scope: 'tweet.read tweet.write users.read offline.access',
    clientId: process.env.TWITTER_CLIENT_ID,
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scope: 'w_member_social r_liteprofile',
    clientId: process.env.LINKEDIN_CLIENT_ID,
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scope: 'pages_manage_posts pages_read_engagement',
    clientId: process.env.FACEBOOK_APP_ID,
  },
  instagram: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scope: 'instagram_basic instagram_content_publish',
    clientId: process.env.INSTAGRAM_APP_ID,
  },
  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl',
    clientId: process.env.YOUTUBE_CLIENT_ID,
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/auth/authorize/',
    scope: 'user.info.basic video.upload video.publish',
    clientId: process.env.TIKTOK_CLIENT_KEY,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.redirect('/admin/login');
  }

  const { platform } = req.query;
  const platformKey = platform as string;

  const config = OAUTH_CONFIGS[platformKey as keyof typeof OAUTH_CONFIGS];

  if (!config) {
    return res.status(400).json({ error: 'Invalid platform' });
  }

  if (!config.clientId) {
    return res.status(500).json({
      error: 'OAuth not configured',
      message: `Please set ${platformKey.toUpperCase()}_CLIENT_ID environment variable`,
    });
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/admin/social-media/oauth/${platformKey}/callback`;
  const state = Buffer.from(JSON.stringify({
    userId: session.user.id,
    platform: platformKey,
    timestamp: Date.now(),
  })).toString('base64');

  const authUrl = new URL(config.authUrl);
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', config.scope);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('response_type', 'code');

  // Platform-specific parameters
  if (platformKey === 'twitter') {
    authUrl.searchParams.set('code_challenge', 'challenge');
    authUrl.searchParams.set('code_challenge_method', 'plain');
  }

  return res.redirect(authUrl.toString());
}
