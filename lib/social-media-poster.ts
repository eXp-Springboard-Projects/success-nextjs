/**
 * Social Media Posting Library
 *
 * Helper functions for posting to various social media platforms.
 */

import { supabaseAdmin } from './supabase';

interface PostContent {
  content: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
}

interface PostResult {
  platform: string;
  success: boolean;
  errorMessage?: string;
  platformPostId?: string;
  platformPostUrl?: string;
}

/**
 * Post to Twitter/X
 */
async function postToTwitter(
  accessToken: string,
  content: PostContent
): Promise<PostResult> {
  try {
    const tweetData: any = {
      text: content.content,
    };

    // Add media if image URL provided
    if (content.imageUrl) {
      // Would need to upload image first and get media_id
      // For now, we'll just add the URL to the text
      tweetData.text = `${content.content}\n\n${content.linkUrl || ''}`.trim();
    } else if (content.linkUrl) {
      tweetData.text = `${content.content}\n\n${content.linkUrl}`.trim();
    }

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.title || 'Failed to post to Twitter');
    }

    return {
      platform: 'twitter',
      success: true,
      platformPostId: data.data.id,
      platformPostUrl: `https://twitter.com/i/web/status/${data.data.id}`,
    };
  } catch (error: any) {
    return {
      platform: 'twitter',
      success: false,
      errorMessage: error.message,
    };
  }
}

/**
 * Post to LinkedIn
 */
async function postToLinkedIn(
  accessToken: string,
  accountId: string,
  content: PostContent
): Promise<PostResult> {
  try {
    const postData = {
      author: `urn:li:person:${accountId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content.content,
          },
          shareMediaCategory: content.linkUrl ? 'ARTICLE' : 'NONE',
          ...(content.linkUrl && {
            media: [{
              status: 'READY',
              originalUrl: content.linkUrl,
            }],
          }),
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to post to LinkedIn');
    }

    return {
      platform: 'linkedin',
      success: true,
      platformPostId: data.id,
      platformPostUrl: `https://www.linkedin.com/feed/update/${data.id}`,
    };
  } catch (error: any) {
    return {
      platform: 'linkedin',
      success: false,
      errorMessage: error.message,
    };
  }
}

/**
 * Post to Facebook
 */
async function postToFacebook(
  accessToken: string,
  pageId: string,
  content: PostContent
): Promise<PostResult> {
  try {
    const params = new URLSearchParams({
      message: content.content,
      access_token: accessToken,
    });

    if (content.linkUrl) {
      params.set('link', content.linkUrl);
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      {
        method: 'POST',
        body: params,
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Failed to post to Facebook');
    }

    return {
      platform: 'facebook',
      success: true,
      platformPostId: data.id,
      platformPostUrl: `https://www.facebook.com/${data.id}`,
    };
  } catch (error: any) {
    return {
      platform: 'facebook',
      success: false,
      errorMessage: error.message,
    };
  }
}

/**
 * Post to Instagram
 */
async function postToInstagram(
  accessToken: string,
  accountId: string,
  content: PostContent
): Promise<PostResult> {
  try {
    if (!content.imageUrl) {
      throw new Error('Instagram requires an image');
    }

    // Create container
    const containerParams = new URLSearchParams({
      image_url: content.imageUrl,
      caption: content.content,
      access_token: accessToken,
    });

    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media`,
      {
        method: 'POST',
        body: containerParams,
      }
    );

    const containerData = await containerResponse.json();

    if (containerData.error) {
      throw new Error(containerData.error.message || 'Failed to create Instagram container');
    }

    // Publish container
    const publishParams = new URLSearchParams({
      creation_id: containerData.id,
      access_token: accessToken,
    });

    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media_publish`,
      {
        method: 'POST',
        body: publishParams,
      }
    );

    const publishData = await publishResponse.json();

    if (publishData.error) {
      throw new Error(publishData.error.message || 'Failed to publish to Instagram');
    }

    return {
      platform: 'instagram',
      success: true,
      platformPostId: publishData.id,
      platformPostUrl: `https://www.instagram.com/p/${publishData.id}`,
    };
  } catch (error: any) {
    return {
      platform: 'instagram',
      success: false,
      errorMessage: error.message,
    };
  }
}

/**
 * Post to multiple platforms
 */
export async function postToSocialMedia(
  postId: string,
  userId: string
): Promise<void> {
  try {
    const supabase = supabaseAdmin();

    // Get post details
    const { data: posts, error: postError } = await supabase
      .from('social_posts')
      .select('content, image_url, link_url, platforms')
      .eq('id', postId)
      .eq('user_id', userId)
      .limit(1);

    if (postError || !posts || posts.length === 0) {
      throw new Error('Post not found');
    }

    const post = posts[0];

    // Get connected accounts for the platforms
    const { data: accounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('platform, account_id, access_token')
      .eq('user_id', userId)
      .in('platform', post.platforms)
      .eq('is_active', true);

    if (accountsError || !accounts || accounts.length === 0) {
      throw new Error('No active accounts found for selected platforms');
    }

    const content: PostContent = {
      content: post.content,
      imageUrl: post.image_url,
      linkUrl: post.link_url,
    };

    // Post to each platform
    const results: PostResult[] = [];

    for (const account of accounts) {
      let result: PostResult;

      switch (account.platform) {
        case 'twitter':
          result = await postToTwitter(account.access_token, content);
          break;
        case 'linkedin':
          result = await postToLinkedIn(account.access_token, account.account_id, content);
          break;
        case 'facebook':
          result = await postToFacebook(account.access_token, account.account_id, content);
          break;
        case 'instagram':
          result = await postToInstagram(account.access_token, account.account_id, content);
          break;
        default:
          result = {
            platform: account.platform,
            success: false,
            errorMessage: 'Unsupported platform',
          };
      }

      results.push(result);

      // Save result to database
      await supabase.from('social_post_results').insert({
        post_id: postId,
        platform: result.platform,
        success: result.success,
        error_message: result.errorMessage || null,
        platform_post_id: result.platformPostId || null,
        platform_post_url: result.platformPostUrl || null,
      });
    }

    // Update post status
    const allSuccessful = results.every(r => r.success);
    const allFailed = results.every(r => !r.success);

    await supabase
      .from('social_posts')
      .update({
        status: allSuccessful ? 'POSTED' : allFailed ? 'FAILED' : 'POSTED',
        posted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

  } catch (error: any) {
    console.error('Error posting to social media:', error);

    const supabase = supabaseAdmin();

    // Mark post as failed
    await supabase
      .from('social_posts')
      .update({
        status: 'FAILED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    throw error;
  }
}

/**
 * Generate social media post from article
 */
export function generateSocialPostFromArticle(article: {
  title: string;
  excerpt?: string;
  slug: string;
  featuredImage?: string | null;
}): PostContent {
  const url = `${process.env.NEXTAUTH_URL}/blog/${article.slug}`;

  // Generate engaging post content
  const content = article.excerpt
    ? `${article.title}\n\n${article.excerpt.substring(0, 200)}${article.excerpt.length > 200 ? '...' : ''}\n\nRead more:`
    : `${article.title}\n\nRead the full article:`;

  return {
    content,
    linkUrl: url,
    imageUrl: article.featuredImage || null,
  };
}
