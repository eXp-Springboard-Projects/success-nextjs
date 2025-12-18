/**
 * Daily Sync Cron Job
 *
 * This API endpoint is called daily by Vercel Cron to:
 * 1. Revalidate all critical pages
 * 2. Sync latest content from WordPress
 * 3. Clear stale cache
 *
 * Vercel Cron configuration in vercel.json
 */

import { fetchWordPressData } from '../../../lib/wordpress';

export default async function handler(req, res) {
  // Verify this is called by Vercel Cron (check authorization header)
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const results = {
      timestamp: new Date().toISOString(),
      revalidated: [],
      errors: [],
    };

    // 1. Fetch latest content to verify WordPress API is accessible
    try {
      const latestPosts = await fetchWordPressData('posts?_embed&per_page=10');
      results.latestPostsCount = latestPosts.length;
    } catch (error) {
      results.errors.push({
        step: 'fetch_latest_posts',
        error: error.message,
      });
    }

    // 2. Revalidate homepage
    try {
      await res.revalidate('/');
      results.revalidated.push('/');
    } catch (error) {
      results.errors.push({
        path: '/',
        error: error.message,
      });
    }

    // 3. Revalidate key category pages
    const categories = [
      'business',
      'money',
      'lifestyle',
      'entertainment',
      'health',
      'future-of-work',
    ];

    for (const category of categories) {
      try {
        await res.revalidate(`/category/${category}`);
        results.revalidated.push(`/category/${category}`);
      } catch (error) {
        results.errors.push({
          path: `/category/${category}`,
          error: error.message,
        });
      }
    }

    // 4. Revalidate static pages
    const staticPages = [
      '/magazine',
      '/videos',
      '/podcasts',
      '/bestsellers',
      '/speakers',
      '/success-plus',
      '/store',
    ];

    for (const page of staticPages) {
      try {
        await res.revalidate(page);
        results.revalidated.push(page);
      } catch (error) {
        results.errors.push({
          path: page,
          error: error.message,
        });
      }
    }

    // 5. Get latest posts and revalidate their pages
    try {
      const recentPosts = await fetchWordPressData('posts?per_page=20');

      for (const post of recentPosts) {
        try {
          await res.revalidate(`/blog/${post.slug}`);
          results.revalidated.push(`/blog/${post.slug}`);
        } catch (error) {
          results.errors.push({
            path: `/blog/${post.slug}`,
            error: error.message,
          });
        }
      }
    } catch (error) {
      results.errors.push({
        step: 'revalidate_recent_posts',
        error: error.message,
      });
    }

return res.status(200).json({
      success: true,
      message: 'Daily sync completed',
      results,
    });
  } catch (error) {
    console.error('Daily sync failed:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
