import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

interface WordPressMediaItem {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: { rendered: string };
  author: number;
  caption: { rendered: string };
  alt_text: string;
  media_type: string;
  mime_type: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    sizes: Record<string, any>;
    image_meta: any;
  };
  source_url: string;
  _links: any;
}

/**
 * Scrape all media from WordPress REST API
 * Supports pagination and batch processing
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

  const { page = 1, perPage = 100, dryRun = false } = req.body;

  try {
    // Try multiple WordPress API endpoints
    const apiUrls = [
      'https://successcom.wpenginepowered.com/wp-json/wp/v2',
      'https://www.success.com/wp-json/wp/v2',
      process.env.WORDPRESS_API_URL,
      process.env.NEXT_PUBLIC_WORDPRESS_API_URL
    ].filter(Boolean);

    let wpResponse: Response | null = null;
    let usedUrl = '';

    // Try each URL until one works
    for (const apiUrl of apiUrls) {
      try {
        const wpUrl = `${apiUrl}/media?per_page=${perPage}&page=${page}&orderby=date&order=desc`;
        console.log('[Media Scraper] Trying:', wpUrl);

        const response = await fetch(wpUrl, {
          headers: {
            'User-Agent': 'SUCCESS-Media-Scraper/1.0'
          }
        });

        if (response.ok) {
          wpResponse = response;
          usedUrl = wpUrl;
          console.log('[Media Scraper] ✓ Success with:', apiUrl);
          break;
        } else {
          console.log('[Media Scraper] ✗ Failed with:', apiUrl, response.status);
        }
      } catch (err) {
        console.log('[Media Scraper] ✗ Error with:', apiUrl);
        continue;
      }
    }

    if (!wpResponse) {
      return res.status(500).json({
        message: 'Could not access WordPress API from any endpoint',
        triedUrls: apiUrls,
        suggestion: 'The WordPress REST API may be blocked. Consider using the HTML scraper instead.'
      });
    }

    console.log('[Media Scraper] Fetching from:', usedUrl);

    const wpMedia: WordPressMediaItem[] = await wpResponse.json();
    const totalPages = parseInt(wpResponse.headers.get('X-WP-TotalPages') || '1');
    const total = parseInt(wpResponse.headers.get('X-WP-Total') || '0');

    console.log(`[Media Scraper] Found ${wpMedia.length} items on page ${page}/${totalPages} (${total} total)`);

    if (dryRun) {
      return res.status(200).json({
        message: 'Dry run completed',
        stats: {
          page,
          totalPages,
          total,
          itemsOnPage: wpMedia.length
        },
        sample: wpMedia.slice(0, 3).map(item => ({
          id: item.id,
          title: item.title.rendered,
          url: item.source_url,
          type: item.mime_type
        }))
      });
    }

    // Import media to database
    const supabase = supabaseAdmin();
    const imported: any[] = [];
    const skipped: any[] = [];
    const errors: any[] = [];

    for (const wpItem of wpMedia) {
      try {
        // Check if media already exists (by WordPress ID or URL)
        const { data: existing } = await supabase
          .from('media')
          .select('id')
          .or(`wordpressId.eq.${wpItem.id},url.eq.${wpItem.source_url}`)
          .single();

        if (existing) {
          skipped.push({
            wpId: wpItem.id,
            reason: 'Already exists',
            url: wpItem.source_url
          });
          continue;
        }

        // Parse filename from source URL
        const urlParts = wpItem.source_url.split('/');
        const filename = urlParts[urlParts.length - 1] || `wp-media-${wpItem.id}`;

        // Prepare media record
        const mediaRecord = {
          wordpressId: wpItem.id,
          filename: filename,
          url: wpItem.source_url,
          mimeType: wpItem.mime_type,
          size: 0, // WordPress doesn't provide file size in API
          width: wpItem.media_details?.width || null,
          height: wpItem.media_details?.height || null,
          alt: wpItem.alt_text || wpItem.title.rendered || '',
          caption: stripHtml(wpItem.caption?.rendered || ''),
          metadata: {
            wpId: wpItem.id,
            wpSlug: wpItem.slug,
            wpAuthor: wpItem.author,
            wpDate: wpItem.date,
            mediaType: wpItem.media_type,
            mediaDetails: wpItem.media_details
          },
          createdAt: new Date(wpItem.date_gmt + 'Z').toISOString(),
          uploadedBy: session.user?.email || 'wordpress-import'
        };

        // Insert into database
        const { data: inserted, error } = await supabase
          .from('media')
          .insert(mediaRecord)
          .select()
          .single();

        if (error) {
          throw error;
        }

        imported.push({
          id: inserted.id,
          wpId: wpItem.id,
          filename: filename,
          url: wpItem.source_url
        });

      } catch (error: any) {
        console.error(`[Media Scraper] Error importing WP media ${wpItem.id}:`, error);
        errors.push({
          wpId: wpItem.id,
          url: wpItem.source_url,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      stats: {
        page,
        totalPages,
        total,
        processed: wpMedia.length,
        imported: imported.length,
        skipped: skipped.length,
        errors: errors.length
      },
      imported,
      skipped,
      errors,
      hasMore: page < totalPages
    });

  } catch (error: any) {
    console.error('[Media Scraper] Fatal error:', error);
    return res.status(500).json({
      message: 'Failed to scrape WordPress media',
      error: error.message
    });
  }
}

/**
 * Strip HTML tags from string
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}
