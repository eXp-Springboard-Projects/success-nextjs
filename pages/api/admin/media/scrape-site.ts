import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import * as cheerio from 'cheerio';

/**
 * Scrape media directly from SUCCESS.com HTML pages
 * Since WordPress REST API is blocked, we'll scrape the actual site
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { mode = 'posts', page = 1, perPage = 20 } = req.body;

  try {
    let urls: string[] = [];

    // Scrape different sections of the site
    if (mode === 'posts') {
      // Scrape blog posts
      urls = await scrapeBlogPosts(page, perPage);
    } else if (mode === 'categories') {
      // Scrape category pages
      urls = await scrapeCategoryPages();
    } else if (mode === 'sitemap') {
      // Scrape from sitemap
      urls = await scrapeSitemap();
    }

    const mediaItems = await extractMediaFromPages(urls);

    // Import to database
    const supabase = supabaseAdmin();
    const imported: any[] = [];
    const skipped: any[] = [];
    const errors: any[] = [];

    for (const media of mediaItems) {
      try {
        // Check if already exists
        const { data: existing } = await supabase
          .from('media')
          .select('id')
          .eq('url', media.url)
          .single();

        if (existing) {
          skipped.push({ url: media.url, reason: 'Already exists' });
          continue;
        }

        // Insert new media
        const { data: inserted, error } = await supabase
          .from('media')
          .insert({
            filename: media.filename,
            url: media.url,
            mimeType: media.mimeType,
            width: media.width,
            height: media.height,
            alt: media.alt,
            caption: media.caption,
            metadata: media.metadata,
            createdAt: new Date().toISOString(),
            uploadedBy: session.user?.email || 'site-scraper'
          })
          .select()
          .single();

        if (error) throw error;

        imported.push({
          id: inserted.id,
          url: media.url,
          filename: media.filename
        });

      } catch (error: any) {
        errors.push({
          url: media.url,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      stats: {
        pagesScraped: urls.length,
        mediaFound: mediaItems.length,
        imported: imported.length,
        skipped: skipped.length,
        errors: errors.length
      },
      imported,
      skipped,
      errors
    });

  } catch (error: any) {
    console.error('[Site Scraper] Error:', error);
    return res.status(500).json({
      message: 'Failed to scrape site',
      error: error.message
    });
  }
}

/**
 * Scrape blog posts to get URLs
 */
async function scrapeBlogPosts(page: number, perPage: number): Promise<string[]> {
  const urls: string[] = [];

  // SUCCESS.com blog structure
  const blogUrl = `https://www.success.com/category/all-articles/page/${page}/`;

  try {
    const response = await fetch(blogUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log('[Scraper] Blog page not accessible:', response.status);
      return urls;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Find all article links
    $('article a, .post a, .article-link').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('success.com') && !href.includes('#')) {
        urls.push(href);
      }
    });

  } catch (error) {
    console.error('[Scraper] Error scraping blog posts:', error);
  }

  return [...new Set(urls)]; // Remove duplicates
}

/**
 * Scrape category pages
 */
async function scrapeCategoryPages(): Promise<string[]> {
  const urls: string[] = [];
  const categories = [
    'business-branding',
    'entrepreneurship',
    'ai-technology',
    'health-wellness',
    'culture-workplace',
    'lifestyle',
    'money',
    'entertainment'
  ];

  for (const category of categories) {
    const categoryUrl = `https://www.success.com/category/${category}/`;

    try {
      const response = await fetch(categoryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) continue;

      const html = await response.text();
      const $ = cheerio.load(html);

      $('article a, .post a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('success.com')) {
          urls.push(href);
        }
      });

    } catch (error) {
      console.error(`[Scraper] Error scraping category ${category}:`, error);
    }
  }

  return [...new Set(urls)];
}

/**
 * Scrape sitemap for all URLs
 */
async function scrapeSitemap(): Promise<string[]> {
  const urls: string[] = [];

  try {
    const sitemapUrl = 'https://www.success.com/sitemap.xml';
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log('[Scraper] Sitemap not accessible');
      return urls;
    }

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    $('url loc').each((_, el) => {
      const url = $(el).text();
      if (url && !url.includes('category') && !url.includes('tag')) {
        urls.push(url);
      }
    });

  } catch (error) {
    console.error('[Scraper] Error scraping sitemap:', error);
  }

  return urls.slice(0, 100); // Limit to first 100 for performance
}

/**
 * Extract media from page URLs
 */
async function extractMediaFromPages(urls: string[]): Promise<any[]> {
  const allMedia: any[] = [];
  const mediaUrls = new Set<string>();

  for (const url of urls.slice(0, 20)) { // Process first 20 URLs to avoid timeout
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) continue;

      const html = await response.text();
      const $ = cheerio.load(html);

      // Find all images
      $('img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        const alt = $(el).attr('alt') || '';
        const width = parseInt($(el).attr('width') || '0');
        const height = parseInt($(el).attr('height') || '0');

        if (src && !mediaUrls.has(src)) {
          // Filter out icons, placeholders, etc.
          if (src.includes('gravatar') ||
              src.includes('emoji') ||
              src.includes('icon') ||
              src.includes('logo') ||
              src.includes('wp-includes')) {
            return;
          }

          mediaUrls.add(src);

          const filename = src.split('/').pop() || 'unknown';
          const ext = filename.split('.').pop()?.toLowerCase() || '';
          const mimeType = getMimeType(ext);

          allMedia.push({
            url: src,
            filename,
            mimeType,
            width: width || null,
            height: height || null,
            alt: alt.substring(0, 500), // Limit alt text length
            caption: '',
            metadata: {
              sourceUrl: url,
              scrapedAt: new Date().toISOString()
            }
          });
        }
      });

      // Also check for background images in CSS
      $('[style*="background-image"]').each((_, el) => {
        const style = $(el).attr('style') || '';
        const match = style.match(/url\(['"]?([^'"()]+)['"]?\)/);
        if (match && match[1] && !mediaUrls.has(match[1])) {
          const src = match[1];
          mediaUrls.add(src);

          const filename = src.split('/').pop() || 'unknown';
          const ext = filename.split('.').pop()?.toLowerCase() || '';

          allMedia.push({
            url: src,
            filename,
            mimeType: getMimeType(ext),
            width: null,
            height: null,
            alt: '',
            caption: '',
            metadata: {
              sourceUrl: url,
              scrapedAt: new Date().toISOString(),
              extractedFrom: 'background-image'
            }
          });
        }
      });

    } catch (error) {
      console.error(`[Scraper] Error extracting media from ${url}:`, error);
    }
  }

  return allMedia;
}

/**
 * Get MIME type from file extension
 */
function getMimeType(ext: string): string {
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    pdf: 'application/pdf'
  };

  return types[ext] || 'image/jpeg';
}
