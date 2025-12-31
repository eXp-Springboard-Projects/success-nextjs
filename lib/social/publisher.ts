/**
 * Post Publisher
 *
 * Handles the core logic for publishing posts to social platforms
 */

import { supabaseAdmin } from '@/lib/supabase';
import {
  SocialPost,
  SocialAccount,
  MediaItem,
  Platform,
  SocialPostResult,
} from '@/types/social';
import { publishToPlatform } from './platforms';

/**
 * Publish a post to all target platforms
 */
export async function publishPost(postId: string): Promise<{
  success: boolean;
  results: SocialPostResult[];
  errors: string[];
}> {
  const db = supabaseAdmin();

  try {
    // Get the post
    const { data: post, error: postError } = await db
      .from('social_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      throw new Error('Post not found');
    }

    // Update post status to publishing
    await db
      .from('social_posts')
      .update({ status: 'publishing' })
      .eq('id', postId);

    // Get connected accounts for target platforms
    const { data: accounts, error: accountsError } = await db
      .from('social_accounts')
      .select('*')
      .eq('user_id', post.user_id)
      .in('platform', post.target_platforms)
      .eq('is_active', true);

    if (accountsError) {
      throw new Error('Failed to fetch social accounts');
    }

    if (!accounts || accounts.length === 0) {
      throw new Error('No connected accounts found for target platforms');
    }

    // Get media items
    let media: MediaItem[] = [];
    if (post.media_ids && post.media_ids.length > 0) {
      const { data: mediaData, error: mediaError } = await db
        .from('social_media_library')
        .select('*')
        .in('id', post.media_ids);

      if (!mediaError && mediaData) {
        media = mediaData as MediaItem[];
      }
    }

    // Publish to each platform
    const results: SocialPostResult[] = [];
    const errors: string[] = [];

    for (const account of accounts) {
      try {
        const result = await publishToPlatform(
          account as SocialAccount,
          post as SocialPost,
          media
        );

        // Create success result
        const { data: resultData, error: resultError } = await db
          .from('social_post_results')
          .insert({
            post_id: postId,
            social_account_id: account.id,
            platform: account.platform,
            platform_post_id: result.platformPostId,
            platform_post_url: result.platformPostUrl,
            status: 'posted',
            posted_at: result.postedAt,
          })
          .select()
          .single();

        if (!resultError && resultData) {
          results.push(resultData as SocialPostResult);
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        errors.push(`${account.platform}: ${errorMessage}`);

        // Create failure result
        await db.from('social_post_results').insert({
          post_id: postId,
          social_account_id: account.id,
          platform: account.platform,
          status: 'failed',
          error_message: errorMessage,
        });
      }
    }

    // Update post status
    const finalStatus = errors.length === 0 ? 'published' : errors.length < accounts.length ? 'published' : 'failed';

    await db
      .from('social_posts')
      .update({
        status: finalStatus,
        published_at: errors.length < accounts.length ? new Date().toISOString() : null,
      })
      .eq('id', postId);

    // Handle evergreen recycling
    if (post.is_evergreen && post.evergreen_interval_days && finalStatus === 'published') {
      await scheduleEvergreenRecycle(postId, post.evergreen_interval_days);
    }

    return {
      success: errors.length === 0,
      results,
      errors,
    };
  } catch (error) {
    // Update post status to failed
    await db
      .from('social_posts')
      .update({ status: 'failed' })
      .eq('id', postId);

    throw error;
  }
}

/**
 * Schedule an evergreen post to be recycled
 */
async function scheduleEvergreenRecycle(postId: string, intervalDays: number): Promise<void> {
  const db = supabaseAdmin();

  const nextRecycleDate = new Date();
  nextRecycleDate.setDate(nextRecycleDate.getDate() + intervalDays);

  // Create a new draft post with same content
  const { data: originalPost } = await db
    .from('social_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (originalPost) {
    await db.from('social_posts').insert({
      user_id: originalPost.user_id,
      content: originalPost.content,
      content_variants: originalPost.content_variants,
      media_urls: originalPost.media_urls,
      media_ids: originalPost.media_ids,
      link_url: originalPost.link_url,
      link_preview: originalPost.link_preview,
      scheduled_at: nextRecycleDate.toISOString(),
      status: 'scheduled',
      target_platforms: originalPost.target_platforms,
      is_evergreen: true,
      evergreen_interval_days: intervalDays,
      recycle_count: (originalPost.recycle_count || 0) + 1,
    });

    // Update original post
    await db
      .from('social_posts')
      .update({
        last_recycled_at: new Date().toISOString(),
      })
      .eq('id', postId);
  }
}

/**
 * Get posts that are due to be published
 */
export async function getDuePosts(): Promise<SocialPost[]> {
  const db = supabaseAdmin();

  const { data, error } = await db
    .from('social_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true });

  if (error) {
    throw new Error('Failed to fetch due posts');
  }

  return (data as SocialPost[]) || [];
}

/**
 * Publish all due posts (called by cron)
 */
export async function publishDuePosts(): Promise<{
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ postId: string; error: string }>;
}> {
  const duePosts = await getDuePosts();

  const results = {
    total: duePosts.length,
    successful: 0,
    failed: 0,
    errors: [] as Array<{ postId: string; error: string }>,
  };

  for (const post of duePosts) {
    try {
      const result = await publishPost(post.id);
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push({
          postId: post.id,
          error: result.errors.join('; '),
        });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        postId: post.id,
        error: (error as Error).message,
      });
    }
  }

  return results;
}
