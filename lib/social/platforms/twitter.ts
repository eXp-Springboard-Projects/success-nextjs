/**
 * Twitter/X API Client
 *
 * OAuth 2.0 with PKCE for authentication
 * API v2 for posting
 */

import {
  SocialAccount,
  SocialPost,
  MediaItem,
  TokenPair,
  PlatformPostResult,
  AnalyticsData,
  PlatformClient,
  OAuthConfig,
} from '@/types/social';
import { decryptToken, encryptToken } from '../encryption';

const TWITTER_API_BASE = 'https://api.twitter.com/2';
const TWITTER_UPLOAD_BASE = 'https://upload.twitter.com/1.1';

/**
 * Get Twitter OAuth configuration
 */
export function getTwitterOAuthConfig(): OAuthConfig {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (!clientId || !clientSecret) {
    throw new Error('Twitter API credentials not configured');
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${baseUrl}/api/social/oauth/twitter/callback`,
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
  };
}

/**
 * Build Twitter OAuth authorization URL
 */
export function buildTwitterAuthUrl(state: string, codeChallenge: string): string {
  const config = getTwitterOAuthConfig();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<TokenPair> {
  const config = getTwitterOAuthConfig();

  const params = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${config.clientId}:${config.clientSecret}`
      ).toString('base64')}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twitter token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: encryptToken(data.access_token),
    refreshToken: data.refresh_token ? encryptToken(data.refresh_token) : undefined,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined,
  };
}

/**
 * Get user info from Twitter
 */
export async function getTwitterUserInfo(accessToken: string) {
  const response = await fetch(`${TWITTER_API_BASE}/users/me`, {
    headers: {
      Authorization: `Bearer ${decryptToken(accessToken)}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Twitter user info');
  }

  const data = await response.json();

  return {
    id: data.data.id,
    username: data.data.username,
    name: data.data.name,
    profileImageUrl: data.data.profile_image_url,
  };
}

/**
 * Twitter Platform Client Implementation
 */
export const twitterClient: PlatformClient = {
  /**
   * Validate if token is still valid
   */
  async validateToken(account: SocialAccount): Promise<boolean> {
    try {
      const response = await fetch(`${TWITTER_API_BASE}/users/me`, {
        headers: {
          Authorization: `Bearer ${decryptToken(account.accessToken)}`,
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  },

  /**
   * Refresh an expired token
   */
  async refreshToken(account: SocialAccount): Promise<TokenPair> {
    if (!account.refreshToken) {
      throw new Error('No refresh token available');
    }

    const config = getTwitterOAuthConfig();

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: decryptToken(account.refreshToken),
      client_id: config.clientId,
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${config.clientId}:${config.clientSecret}`
        ).toString('base64')}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twitter token refresh failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: encryptToken(data.access_token),
      refreshToken: data.refresh_token ? encryptToken(data.refresh_token) : undefined,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  },

  /**
   * Publish a post to Twitter
   */
  async publishPost(
    account: SocialAccount,
    post: SocialPost,
    media: MediaItem[]
  ): Promise<PlatformPostResult> {
    const token = decryptToken(account.accessToken);

    // Get content for Twitter (use variant if available)
    const content = post.contentVariants.twitter || post.content;

    // Truncate if over 280 characters
    const tweetText = content.length > 280 ? content.substring(0, 277) + '...' : content;

    // Upload media if present
    const mediaIds: string[] = [];
    for (const item of media.slice(0, 4)) {
      // Twitter allows max 4 images
      const mediaId = await uploadMediaToTwitter(token, item);
      mediaIds.push(mediaId);
    }

    // Create tweet
    const tweetData: any = {
      text: tweetText,
    };

    if (mediaIds.length > 0) {
      tweetData.media = {
        media_ids: mediaIds,
      };
    }

    const response = await fetch(`${TWITTER_API_BASE}/tweets`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twitter post failed: ${JSON.stringify(error)}`);
    }

    const result = await response.json();

    return {
      platformPostId: result.data.id,
      platformPostUrl: `https://twitter.com/${account.platformUsername}/status/${result.data.id}`,
      postedAt: new Date(),
    };
  },

  /**
   * Delete a tweet
   */
  async deletePost(account: SocialAccount, platformPostId: string): Promise<void> {
    const token = decryptToken(account.accessToken);

    const response = await fetch(`${TWITTER_API_BASE}/tweets/${platformPostId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete Twitter post');
    }
  },

  /**
   * Get analytics for a tweet
   */
  async getAnalytics(account: SocialAccount, platformPostId: string): Promise<AnalyticsData> {
    const token = decryptToken(account.accessToken);

    const response = await fetch(
      `${TWITTER_API_BASE}/tweets/${platformPostId}?tweet.fields=public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Twitter analytics');
    }

    const data = await response.json();
    const metrics = data.data.public_metrics;

    return {
      impressions: metrics.impression_count || 0,
      engagements: (metrics.retweet_count || 0) + (metrics.reply_count || 0) + (metrics.like_count || 0),
      likes: metrics.like_count || 0,
      comments: metrics.reply_count || 0,
      shares: metrics.retweet_count || 0,
      clicks: 0, // Not available in basic metrics
    };
  },
};

/**
 * Upload media to Twitter
 */
async function uploadMediaToTwitter(token: string, media: MediaItem): Promise<string> {
  // Download the media file
  const fileResponse = await fetch(media.fileUrl);
  const fileBuffer = await fileResponse.arrayBuffer();

  // Initialize upload
  const initResponse = await fetch(`${TWITTER_UPLOAD_BASE}/media/upload.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      command: 'INIT',
      total_bytes: fileBuffer.byteLength.toString(),
      media_type: media.fileType,
    }),
  });

  if (!initResponse.ok) {
    throw new Error('Twitter media upload init failed');
  }

  const { media_id_string } = await initResponse.json();

  // Append data
  const appendResponse = await fetch(`${TWITTER_UPLOAD_BASE}/media/upload.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: new URLSearchParams({
      command: 'APPEND',
      media_id: media_id_string,
      segment_index: '0',
      media: Buffer.from(fileBuffer).toString('base64'),
    }),
  });

  if (!appendResponse.ok) {
    throw new Error('Twitter media upload append failed');
  }

  // Finalize upload
  const finalizeResponse = await fetch(`${TWITTER_UPLOAD_BASE}/media/upload.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      command: 'FINALIZE',
      media_id: media_id_string,
    }),
  });

  if (!finalizeResponse.ok) {
    throw new Error('Twitter media upload finalize failed');
  }

  return media_id_string;
}
