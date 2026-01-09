import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabaseUrl = 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQyODk0NywiZXhwIjoyMDgyMDA0OTQ3fQ.t4ADR0oV5sJCMNp1adP2vTsxV1W3Pfizw_uyO3BFYd4';

async function scrapeMissingPost() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Scraping missing affiliate post...\n');

  // Fetch the HTML page
  const response = await fetch('https://successcom.wpenginepowered.com/25-minute-fitness-iron-bodyfit/');
  const html = await response.text();

  // Extract title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(' - SUCCESS', '').trim() : '25-Minute Fitness: How Iron Bodyfit Redefines Workouts';

  // Extract og:description as excerpt
  const descMatch = html.match(/property="og:description"[^>]*content="([^"]+)"/);
  const excerpt = descMatch ? descMatch[1] : 'Discover how Iron Bodyfit uses 25-minute EMS sessions to help busy people build strength, reduce stress and reshape fitness expectations.';

  // Extract featured image
  const imgMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/);
  const featuredImage = imgMatch ? imgMatch[1] : 'https://successcom.wpenginepowered.com/wp-content/uploads/2025/06/iron-bodyfit.jpg';

  // Extract article content (between main article tags)
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
  let content = '';

  if (articleMatch) {
    // Clean up the content - remove scripts, styles, and Elementor wrapper divs
    content = articleMatch[1]
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<div class="elementor[^"]*"[^>]*>/gi, '')
      .replace(/<\/div>/gi, '')
      .trim();
  } else {
    content = `<p>${excerpt}</p>`;
  }

  // Get a valid user ID
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .limit(1)
    .single();

  const defaultAuthorId = users?.id || null;

  console.log('📝 Post details:');
  console.log(`   Title: ${title}`);
  console.log(`   Slug: 25-minute-fitness-iron-bodyfit`);
  console.log(`   Excerpt: ${excerpt.substring(0, 100)}...`);
  console.log(`   Featured Image: ${featuredImage}`);
  console.log(`   Content length: ${content.length} chars`);
  console.log(`   Author ID: ${defaultAuthorId}`);

  // Check if post already exists
  const { data: existing } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', '25-minute-fitness-iron-bodyfit')
    .single();

  if (existing) {
    console.log('\n⚠️  Post already exists in database with ID:', existing.id);
    return;
  }

  // Insert the post
  const { data: newPost, error } = await supabase
    .from('posts')
    .insert({
      id: nanoid(),
      title,
      slug: '25-minute-fitness-iron-bodyfit',
      content,
      excerpt,
      status: 'PUBLISHED',
      publishedAt: new Date('2025-11-17T20:32:29Z').toISOString(),
      updatedAt: new Date('2025-11-17T20:37:01Z').toISOString(),
      createdAt: new Date('2025-11-17T20:32:29Z').toISOString(),
      featuredImage,
      featuredImageAlt: 'Iron Bodyfit fitness training',
      authorId: defaultAuthorId,
      authorName: 'Hadri Jaffal',
      wordpressId: null,
      wordpressAuthor: null,
      readTime: 5,
      views: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('\n❌ Error creating post:', error.message);
    return;
  }

  console.log('\n✅ Successfully created missing affiliate post!');
  console.log(`   Post ID: ${newPost.id}`);
  console.log(`   URL: https://www.success.com/blog/${newPost.slug}`);
}

scrapeMissingPost()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
