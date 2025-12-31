/**
 * LinkedIn API Client
 *
 * OAuth 2.0 for authentication
 * Share API for posting
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

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

/**
 * Get LinkedIn OAuth configuration
 */
export function getLinkedInOAuthConfig(): OAuthConfig {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (!clientId || !clientSecret) {
    throw new Error('LinkedIn API credentials not configured');
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${baseUrl}/api/social/oauth/linkedin/callback`,
    scopes: ['openid', 'profile', 'w_member_social', 'email'],
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
  };
}

/**
 * Build LinkedIn OAuth authorization URL
 */
export function buildLinkedInAuthUrl(state: string): string {
  const config = getLinkedInOAuthConfig();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state,
  });

  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<TokenPair> {
  const config = getLinkedInOAuthConfig();

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn token exchange failed: ${error}`);
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
 * Get user info from LinkedIn
 */
export async function getLinkedInUserInfo(accessToken: string) {
  const token = decryptToken(accessToken);

  // Get user profile
  const profileResponse = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!profileResponse.ok) {
    throw new Error('Failed to fetch LinkedIn user info');
  }

  const profile = await profileResponse.json();

  return {
    id: profile.sub,
    username: profile.email?.split('@')[0] || profile.sub,
    name: profile.name || `${profile.given_name} ${profile.family_name}`,
    profileImageUrl: profile.picture,
  };
}

/**
 * LinkedIn Platform Client Implementation
 */
export const linkedInClient: PlatformClient = {
  /**
   * Validate if token is still valid
   */
  async validateToken(account: SocialAccount): Promise<boolean> {
    try {
      const response = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
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
   * Note: LinkedIn requires re-authentication, no refresh tokens
   */
  async refreshToken(account: SocialAccount): Promise<TokenPair> {
    throw new Error('LinkedIn does not support token refresh. User must re-authenticate.');
  },

  /**
   * Publish a post to LinkedIn
   */
  async publishPost(
    account: SocialAccount,
    post: SocialPost,
    media: MediaItem[]
  ): Promise<PlatformPostResult> {
    const token = decryptToken(account.accessToken);

    // Get content for LinkedIn (use variant if available)
    const content = post.contentVariants.linkedin || post.content;

    // Prepare share data
    const shareData: any = {
      author: `urn:li:person:${account.platformUserId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: media.length > 0 ? 'IMAGE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    // Add media if present
    if (media.length > 0) {
      const uploadedMedia = [];

      for (const item of media.slice(0, 9)) {
        // LinkedIn allows max 9 images
        const mediaUrn = await uploadMediaToLinkedIn(token, account.platformUserId, item);
        uploadedMedia.push({
          status: 'READY',
          media: mediaUrn,
        });
      }

      shareData.specificContent['com.linkedin.ugc.ShareContent'].media = uploadedMedia;
    }

    const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(shareData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LinkedIn post failed: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    const postId = result.id;

    return {
      platformPostId: postId,
      platformPostUrl: `https://www.linkedin.com/feed/update/${postId}`,
      postedAt: new Date(),
    };
  },

  /**
   * Delete a LinkedIn post
   */
  async deletePost(account: SocialAccount, platformPostId: string): Promise<void> {
    const token = decryptToken(account.accessToken);

    const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts/${platformPostId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete LinkedIn post');
    }
  },

  /**
   * Get analytics for a LinkedIn post
   * Note: Analytics API requires additional permissions
   */
  async getAnalytics(account: SocialAccount, platformPostId: string): Promise<AnalyticsData> {
    // LinkedIn analytics API is complex and requires additional setup
    // For now, return zeros
    return {
      impressions: 0,
      engagements: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
    };
  },
};

/**
 * Upload media to LinkedIn
 */
async function uploadMediaToLinkedIn(
  token: string,
  personId: string,
  media: MediaItem
): Promise<string> {
  // Register upload
  const registerData = {
    registerUploadRequest: {
      recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
      owner: `urn:li:person:${personId}`,
      serviceRelationships: [
        {
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        },
      ],
    },
  };

  const registerResponse = await fetch(`${LINKEDIN_API_BASE}/assets?action=registerUpload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(registerData),
  });

  if (!registerResponse.ok) {
    throw new Error('LinkedIn media registration failed');
  }

  const registerResult = await registerResponse.json();
  const uploadUrl = registerResult.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = registerResult.value.asset;

  // Download media file
  const fileResponse = await fetch(media.fileUrl);
  const fileBuffer = await fileResponse.arrayBuffer();

  // Upload media
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': media.fileType,
    },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error('LinkedIn media upload failed');
  }

  return asset;
}
