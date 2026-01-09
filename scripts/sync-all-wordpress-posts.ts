import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabaseUrl = 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg4MjQyMCwiZXhwIjoyMDQ1NDU4NDIwfQ.sb_secret_bx9obYWu-6qwAoNavXVGCg_m3vemyQKqQwqYQX52OM';
const WP_API_URL = 'https://successcom.wpenginepowered.com/wp-json/wp/v2';

interface WPPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  slug: string;
  date: string;
  modified: string;
  status: string;
  categories: number[];
  tags: number[];
  _embedded?: {
    author?: Array<{ id: number; name: string; slug: string }>;
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text?: string }>;
    'wp:term'?: Array<Array<{ id: number; name: string; slug: string }>>;
  };
}

async function syncAllWordPressPosts() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔄 Starting WordPress posts sync to Supabase...\n');

  let page = 1;
  let totalImported = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let hasMore = true;

  while (hasMore) {
    console.log(`📄 Fetching page ${page}...`);

    try {
      const response = await fetch(
        `${WP_API_URL}/posts?per_page=100&page=${page}&_embed&status=publish`,
        {
          headers: { 'User-Agent': 'SUCCESS-Sync-Script' }
        }
      );

      if (!response.ok) {
        if (response.status === 400) {
          console.log('✅ Reached end of posts (page out of range)');
          hasMore = false;
          break;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const posts: WPPost[] = await response.json();

      if (posts.length === 0) {
        console.log('✅ No more posts to fetch');
        hasMore = false;
        break;
      }

      console.log(`   Found ${posts.length} posts on page ${page}`);

      for (const wpPost of posts) {
        try {
          // Check if post already exists by WordPress ID
          const { data: existing } = await supabase
            .from('posts')
            .select('id, updatedAt')
            .eq('wordpressId', wpPost.id.toString())
            .single();

          const author = wpPost._embedded?.author?.[0];
          const featuredMedia = wpPost._embedded?.['wp:featuredmedia']?.[0];
          const categories = wpPost._embedded?.['wp:term']?.[0] || [];
          const tags = wpPost._embedded?.['wp:term']?.[1] || [];

          const postData = {
            title: wpPost.title.rendered.replace(/&#8217;/g, "'").replace(/&#8220;/g, '"').replace(/&#8221;/g, '"'),
            slug: wpPost.slug,
            content: wpPost.content.rendered,
            excerpt: wpPost.excerpt.rendered,
            status: 'PUBLISHED',
            publishedAt: new Date(wpPost.date).toISOString(),
            updatedAt: new Date(wpPost.modified).toISOString(),
            featuredImage: featuredMedia?.source_url || null,
            featuredImageAlt: featuredMedia?.alt_text || null,
            wordpressId: wpPost.id.toString(),
            wordpressAuthor: author?.name || null,
            authorName: author?.name || null,
            source: 'wordpress_import',
          };

          if (existing) {
            // Update if WordPress post is newer
            const wpModified = new Date(wpPost.modified);
            const dbUpdated = new Date(existing.updatedAt);

            if (wpModified > dbUpdated) {
              const { error } = await supabase
                .from('posts')
                .update(postData)
                .eq('id', existing.id);

              if (error) {
                console.error(`   ❌ Error updating ${wpPost.title.rendered}:`, error.message);
              } else {
                totalUpdated++;
                if (totalUpdated % 10 === 0) {
                  console.log(`   🔄 Updated ${totalUpdated} posts...`);
                }
              }
            } else {
              totalSkipped++;
            }
          } else {
            // Insert new post
            const { error } = await supabase
              .from('posts')
              .insert({
                id: `wp_${wpPost.id}`,
                ...postData,
                authorId: 'cm4p4s9h90000vwa04h3t8ofi', // Default system user
                readTime: 0,
                views: 0,
                createdAt: new Date(wpPost.date).toISOString(),
              });

            if (error) {
              console.error(`   ❌ Error inserting ${wpPost.title.rendered}:`, error.message);
            } else {
              totalImported++;
              if (totalImported % 10 === 0) {
                console.log(`   📥 Imported ${totalImported} posts...`);
              }
            }
          }
        } catch (error) {
          console.error(`   ❌ Error processing post ${wpPost.id}:`, error instanceof Error ? error.message : error);
        }
      }

      console.log(`   ✓ Processed page ${page}`);
      page++;

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error instanceof Error ? error.message : error);
      hasMore = false;
    }
  }

  console.log('\n✅ WordPress sync complete!');
  console.log(`   📥 Imported: ${totalImported}`);
  console.log(`   🔄 Updated: ${totalUpdated}`);
  console.log(`   ⏭️  Skipped: ${totalSkipped}`);
  console.log(`   📊 Total processed: ${totalImported + totalUpdated + totalSkipped}`);
}

syncAllWordPressPosts()
  .then(() => {
    console.log('\n✨ Sync finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Sync failed:', error);
    process.exit(1);
  });
