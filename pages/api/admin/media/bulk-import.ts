import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Bulk import WordPress media with optimized batch processing
 * Processes multiple pages in a single request for better performance
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

  const { startPage = 1, batchSize = 5, perPage = 100 } = req.body;

  try {
    // Try multiple WordPress API endpoints - prioritize staging API
    const apiUrls = [
      'https://successcom.wpenginepowered.com/wp-json/wp/v2', // Staging (recommended)
      process.env.WORDPRESS_API_URL,
      process.env.NEXT_PUBLIC_WORDPRESS_API_URL,
      'https://www.success.com/wp-json/wp/v2' // Production (may be blocked)
    ].filter(Boolean);

    let workingApiUrl = apiUrls[0] as string;

    const results = {
      pagesProcessed: 0,
      totalImported: 0,
      totalSkipped: 0,
      totalErrors: 0,
      totalAvailable: 0,
      totalPages: 0,
      details: [] as any[]
    };

    // Process multiple pages in batch
    for (let i = 0; i < batchSize; i++) {
      const currentPage = startPage + i;

      try {
        const wpUrl = `${workingApiUrl}/media?per_page=${perPage}&page=${currentPage}`;
        const wpResponse = await fetch(wpUrl, {
          headers: {
            'User-Agent': 'SUCCESS-Media-Scraper/1.0'
          }
        });

        if (!wpResponse.ok) {
          // If page doesn't exist, we've reached the end
          if (wpResponse.status === 400) {
            console.log(`[Bulk Import] Reached end at page ${currentPage}`);
            break;
          }
          throw new Error(`WordPress API returned ${wpResponse.status}`);
        }

        const wpMedia = await wpResponse.json();
        const totalPages = parseInt(wpResponse.headers.get('X-WP-TotalPages') || '1');
        const total = parseInt(wpResponse.headers.get('X-WP-Total') || '0');

        results.totalPages = totalPages;
        results.totalAvailable = total;

        // Stop if we've gone past the last page
        if (currentPage > totalPages) {
          break;
        }

        // Import media from this page
        const pageResult = await importMediaBatch(wpMedia, session.user?.email || undefined);

        results.pagesProcessed++;
        results.totalImported += pageResult.imported;
        results.totalSkipped += pageResult.skipped;
        results.totalErrors += pageResult.errors.length;
        results.details.push({
          page: currentPage,
          ...pageResult
        });

        console.log(`[Bulk Import] Page ${currentPage}/${totalPages}: +${pageResult.imported} imported, ${pageResult.skipped} skipped, ${pageResult.errors.length} errors`);

      } catch (error: any) {
        console.error(`[Bulk Import] Error on page ${currentPage}:`, error);
        results.totalErrors++;
        results.details.push({
          page: currentPage,
          error: error.message
        });
      }
    }

    const hasMore = results.pagesProcessed > 0 &&
                    (startPage + results.pagesProcessed) <= results.totalPages;

    return res.status(200).json({
      success: true,
      ...results,
      hasMore,
      nextPage: startPage + results.pagesProcessed
    });

  } catch (error: any) {
    console.error('[Bulk Import] Fatal error:', error);
    return res.status(500).json({
      message: 'Bulk import failed',
      error: error.message
    });
  }
}

/**
 * Import a batch of media items
 */
async function importMediaBatch(wpMedia: any[], uploadedBy?: string) {
  const supabase = supabaseAdmin();
  const imported: string[] = [];
  const skipped: string[] = [];
  const errors: any[] = [];

  // Get all existing WordPress IDs in one query for efficiency
  const wpIds = wpMedia.map(item => item.id);
  const { data: existing } = await supabase
    .from('media')
    .select('wordpressId')
    .in('wordpressId', wpIds);

  const existingIds = new Set(existing?.map(e => e.wordpressId) || []);

  // Prepare batch insert
  const toInsert: any[] = [];

  for (const wpItem of wpMedia) {
    try {
      // Skip if already exists
      if (existingIds.has(wpItem.id)) {
        skipped.push(wpItem.id.toString());
        continue;
      }

      // Parse filename
      const urlParts = wpItem.source_url.split('/');
      const filename = urlParts[urlParts.length - 1] || `wp-media-${wpItem.id}`;

      // Prepare media record
      toInsert.push({
        wordpressId: wpItem.id,
        filename: filename,
        url: wpItem.source_url,
        mimeType: wpItem.mime_type,
        size: 0,
        width: wpItem.media_details?.width || null,
        height: wpItem.media_details?.height || null,
        alt: wpItem.alt_text || wpItem.title?.rendered || '',
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
        uploadedBy: uploadedBy || 'wordpress-import'
      });

    } catch (error: any) {
      errors.push({
        wpId: wpItem.id,
        url: wpItem.source_url,
        error: error.message
      });
    }
  }

  // Batch insert all at once (much faster than individual inserts)
  if (toInsert.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from('media')
      .insert(toInsert)
      .select('id');

    if (insertError) {
      console.error('[Batch Import] Insert error:', insertError);
      // Add all to errors
      toInsert.forEach(item => {
        errors.push({
          wpId: item.wordpressId,
          url: item.url,
          error: insertError.message
        });
      });
    } else {
      inserted?.forEach(item => imported.push(item.id));
    }
  }

  return {
    imported: imported.length,
    skipped: skipped.length,
    errors
  };
}

/**
 * Strip HTML tags
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}
