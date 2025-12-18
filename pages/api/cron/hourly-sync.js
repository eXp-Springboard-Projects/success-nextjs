import { fetchWordPressData } from '../../../lib/wordpress';

export default async function handler(req, res) {
  // Verify this is called by Vercel Cron
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const results = {
      timestamp: new Date().toISOString(),
      revalidated: [],
      errors: [],
      contentStats: {},
    };

    // 1. Revalidate homepage
    await res.revalidate('/');
    results.revalidated.push('/');

    // 2. Revalidate all category pages
    const categories = [
      'business',
      'money',
      'lifestyle',
      'entertainment',
      'health',
      'future-of-work'
    ];

    for (const category of categories) {
      try {
        await res.revalidate(`/category/${category}`);
        results.revalidated.push(`/category/${category}`);
      } catch (error) {
        results.errors.push({ path: `/category/${category}`, error: error.message });
      }
    }

    // 3. Revalidate static pages
    const staticPages = [
      '/magazine',
      '/videos',
      '/podcasts',
      '/bestsellers',
      '/speakers',
      '/success-plus',
      '/store',
      '/about-us',
      '/contact',
      '/subscribe'
    ];

    for (const page of staticPages) {
      try {
        await res.revalidate(page);
        results.revalidated.push(page);
      } catch (error) {
        results.errors.push({ path: page, error: error.message });
      }
    }

    // 4. Fetch and revalidate latest posts
    try {
      const recentPosts = await fetchWordPressData('posts?per_page=50&_embed');
      results.contentStats.posts = recentPosts.length;

      for (const post of recentPosts) {
        try {
          await res.revalidate(`/blog/${post.slug}`);
          results.revalidated.push(`/blog/${post.slug}`);
        } catch (error) {
          results.errors.push({ path: `/blog/${post.slug}`, error: error.message });
        }
      }
    } catch (error) {
      results.errors.push({ task: 'fetch posts', error: error.message });
    }

    // 5. Fetch and revalidate latest videos
    try {
      const recentVideos = await fetchWordPressData('videos?per_page=20&_embed');
      results.contentStats.videos = recentVideos.length;

      for (const video of recentVideos) {
        try {
          await res.revalidate(`/video/${video.slug}`);
          results.revalidated.push(`/video/${video.slug}`);
        } catch (error) {
          results.errors.push({ path: `/video/${video.slug}`, error: error.message });
        }
      }
    } catch (error) {
      results.errors.push({ task: 'fetch videos', error: error.message });
    }

    // 6. Fetch and revalidate latest podcasts
    try {
      const recentPodcasts = await fetchWordPressData('podcasts?per_page=20&_embed');
      results.contentStats.podcasts = recentPodcasts.length;

      for (const podcast of recentPodcasts) {
        try {
          await res.revalidate(`/podcast/${podcast.slug}`);
          results.revalidated.push(`/podcast/${podcast.slug}`);
        } catch (error) {
          results.errors.push({ path: `/podcast/${podcast.slug}`, error: error.message });
        }
      }
    } catch (error) {
      results.errors.push({ task: 'fetch podcasts', error: error.message });
    }

    // 7. Fetch magazine issues
    try {
      const magazines = await fetchWordPressData('magazines?per_page=10&_embed');
      results.contentStats.magazines = magazines.length;
    } catch (error) {
      results.errors.push({ task: 'fetch magazines', error: error.message });
    }

return res.status(200).json({
      success: true,
      message: 'Hourly sync completed',
      results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
