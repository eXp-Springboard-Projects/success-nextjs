/**
 * Import all WordPress media by calling the admin API
 */

import { supabaseAdmin } from '../lib/supabase';

const WP_API_URL = 'https://successcom.wpenginepowered.com/wp-json/wp/v2';
const PER_PAGE = 100;

async function importAllMedia() {
  console.log('🚀 Starting WordPress media import...\n');

  const supabase = supabaseAdmin();

  try {
    // Get total count
    const firstPageRes = await fetch(`${WP_API_URL}/media?per_page=1`, {
      headers: { 'User-Agent': 'SUCCESS-Media-Scraper/1.0' }
    });

    const totalPages = parseInt(firstPageRes.headers.get('X-WP-TotalPages') || '1');
    const total = parseInt(firstPageRes.headers.get('X-WP-Total') || '0');

    console.log(`📊 Found ${total} media items across ${totalPages} pages\n`);

    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Process each page
    for (let page = 1; page <= totalPages; page++) {
      try {
        console.log(`📄 Processing page ${page}/${totalPages}...`);

        const wpRes = await fetch(`${WP_API_URL}/media?per_page=${PER_PAGE}&page=${page}`, {
          headers: { 'User-Agent': 'SUCCESS-Media-Scraper/1.0' }
        });

        if (!wpRes.ok) {
          console.error(`❌ Page ${page} failed: ${wpRes.status}`);
          continue;
        }

        const wpMedia = await wpRes.json();

        // Get existing WordPress IDs to avoid duplicates
        const wpIds = wpMedia.map((item: any) => item.id);
        const { data: existing } = await supabase
          .from('media')
          .select('wordpressId')
          .in('wordpressId', wpIds);

        const existingIds = new Set(existing?.map(e => e.wordpressId) || []);

        // Prepare batch insert
        const toInsert: any[] = [];

        for (const wpItem of wpMedia) {
          // Skip if already exists
          if (existingIds.has(wpItem.id)) {
            totalSkipped++;
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
            uploadedBy: 'wordpress-import'
          });
        }

        // Batch insert
        if (toInsert.length > 0) {
          const { data: inserted, error: insertError } = await supabase
            .from('media')
            .insert(toInsert)
            .select('id');

          if (insertError) {
            console.error(`❌ Insert error on page ${page}:`, insertError.message);
            totalErrors += toInsert.length;
          } else {
            totalImported += inserted?.length || 0;
            console.log(`   ✅ Imported ${inserted?.length || 0}, Skipped ${wpMedia.length - toInsert.length}`);
          }
        } else {
          console.log(`   ⏭️  All ${wpMedia.length} items already exist`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error: any) {
        console.error(`❌ Error on page ${page}:`, error.message);
        totalErrors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Import complete!');
    console.log(`   Imported: ${totalImported}`);
    console.log(`   Skipped: ${totalSkipped}`);
    console.log(`   Errors: ${totalErrors}`);
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

importAllMedia()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
