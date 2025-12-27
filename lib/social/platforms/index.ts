/**
 * Platform Client Factory
 *
 * Routes platform-specific operations to the correct client
 */

import { Platform, PlatformClient, SocialAccount, SocialPost, MediaItem, PlatformPostResult } from '@/types/social';
import { twitterClient } from './twitter';
import { linkedInClient } from './linkedin';

/**
 * Get the appropriate platform client
 */
export function getPlatformClient(platform: Platform): PlatformClient {
  switch (platform) {
    case 'twitter':
      return twitterClient;
    case 'linkedin':
      return linkedInClient;
    case 'facebook':
      throw new Error('Facebook integration coming soon');
    case 'instagram':
      throw new Error('Instagram integration coming soon');
    case 'threads':
      throw new Error('Threads integration coming soon');
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Validate tokens for all connected accounts
 */
export async function validateAllTokens(accounts: SocialAccount[]): Promise<{
  valid: SocialAccount[];
  expired: SocialAccount[];
}> {
  const results = await Promise.allSettled(
    accounts.map(async (account) => {
      const client = getPlatformClient(account.platform);
      const isValid = await client.validateToken(account);
      return { account, isValid };
    })
  );

  const valid: SocialAccount[] = [];
  const expired: SocialAccount[] = [];

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      if (result.value.isValid) {
        valid.push(result.value.account);
      } else {
        expired.push(result.value.account);
      }
    }
  });

  return { valid, expired };
}

/**
 * Refresh token for an account
 */
export async function refreshAccountToken(account: SocialAccount) {
  const client = getPlatformClient(account.platform);
  return await client.refreshToken(account);
}

/**
 * Publish a post to a specific platform
 */
export async function publishToPlatform(
  account: SocialAccount,
  post: SocialPost,
  media: MediaItem[]
): Promise<PlatformPostResult> {
  const client = getPlatformClient(account.platform);
  return await client.publishPost(account, post, media);
}

/**
 * Delete a post from a specific platform
 */
export async function deleteFromPlatform(account: SocialAccount, platformPostId: string) {
  const client = getPlatformClient(account.platform);
  return await client.deletePost(account, platformPostId);
}

/**
 * Get analytics for a post on a specific platform
 */
export async function getAnalyticsFromPlatform(account: SocialAccount, platformPostId: string) {
  const client = getPlatformClient(account.platform);
  return await client.getAnalytics(account, platformPostId);
}

// Export platform clients for direct use if needed
export { twitterClient } from './twitter';
export { linkedInClient } from './linkedin';

// Export OAuth URL builders
export { buildTwitterAuthUrl, getTwitterOAuthConfig } from './twitter';
export { buildLinkedInAuthUrl, getLinkedInOAuthConfig } from './linkedin';
