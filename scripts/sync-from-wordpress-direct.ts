import { supabaseAdmin } from '../lib/supabase';
import { randomUUID } from 'crypto';

const WORDPRESS_API_URL = 'https://successcom.wpenginepowered.com/wp-json/wp/v2';

async function syncFromWordPress() {
  console.log('🔄 Starting direct WordPress content sync...\n');

  try {
    // Get an admin user ID from database to use as author
    const supabase = supabaseAdmin();
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .or('role.eq.SUPER_ADMIN,role.eq.ADMIN')
      .limit(1)
      .single();

    if (userError || !adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      return;
    }

    const authorId = adminUser.id;
    console.log('Using admin user as author:', authorId);

    // 1. Sync categories
    await syncCategories();

    // 2. Sync tags
    await syncTags();

    // 3. Sync posts
    await syncPosts(authorId);

    console.log('\n✅ WordPress sync complete!');

  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

async function syncCategories() {
  console.log('\n📁 Syncing categories...');

  const response = await fetch(`${WORDPRESS_API_URL}/categories?per_page=100`, {
    headers: { 'User-Agent': 'SUCCESS-Next.js-Sync' },
  });

  if (!response.ok) {
    console.error('Failed to fetch categories:', response.status);
    return;
  }

  const wpCategories = await response.json();
  console.log(`Found ${wpCategories.length} categories`);

  const supabase = supabaseAdmin();
  let created = 0;
  let updated = 0;

  for (const wpCat of wpCategories) {
    const { data: existing } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', wpCat.slug)
      .single();

    if (existing) {
      await supabase
        .from('categories')
        .update({
          name: wpCat.name,
          description: wpCat.description || null,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existing.id);
      updated++;
    } else {
      await supabase
        .from('categories')
        .insert({
          id: randomUUID(),
          name: wpCat.name,
          slug: wpCat.slug,
          description: wpCat.description || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      created++;
    }
  }

  console.log(`✅ Categories: ${created} created, ${updated} updated`);
}

async function syncTags() {
  console.log('\n🏷️  Syncing tags...');

  const response = await fetch(`${WORDPRESS_API_URL}/tags?per_page=100`, {
    headers: { 'User-Agent': 'SUCCESS-Next.js-Sync' },
  });

  if (!response.ok) {
    console.error('Failed to fetch tags:', response.status);
    return;
  }

  const wpTags = await response.json();
  console.log(`Found ${wpTags.length} tags`);

  const supabase = supabaseAdmin();
  let created = 0;
  let updated = 0;

  for (const wpTag of wpTags) {
    const { data: existing } = await supabase
      .from('tags')
      .select('*')
      .eq('slug', wpTag.slug)
      .single();

    if (existing) {
      await supabase
        .from('tags')
        .update({
          name: wpTag.name,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existing.id);
      updated++;
    } else {
      await supabase
        .from('tags')
        .insert({
          id: randomUUID(),
          name: wpTag.name,
          slug: wpTag.slug,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      created++;
    }
  }

  console.log(`✅ Tags: ${created} created, ${updated} updated`);
}

async function syncPosts(authorId: string) {
  console.log('\n📝 Syncing posts...');

  let page = 1;
  let hasMore = true;
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  while (hasMore && page <= 10) { // Limit to 10 pages for initial sync
    console.log(`\nFetching page ${page}...`);

    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?_embed&per_page=50&page=${page}&status=publish`,
      {
        headers: { 'User-Agent': 'SUCCESS-Next.js-Sync' },
      }
    );

    if (!response.ok) {
      if (response.status === 400) {
        console.log('Reached end of posts');
        hasMore = false;
        break;
      }
      console.error('Failed to fetch posts:', response.status);
      break;
    }

    const wpPosts = await response.json();
    console.log(`Found ${wpPosts.length} posts on page ${page}`);

    if (wpPosts.length === 0) {
      hasMore = false;
      break;
    }

    const supabase = supabaseAdmin();

    for (const wpPost of wpPosts) {
      try {
        // Extract featured image
        let featuredImage = null;
        let featuredImageAlt = null;
        if (wpPost._embedded?.['wp:featuredmedia']?.[0]) {
          const media = wpPost._embedded['wp:featuredmedia'][0];
          featuredImage = media.source_url;
          featuredImageAlt = media.alt_text || media.title?.rendered || '';
        }

        // Calculate read time
        const content = wpPost.content?.rendered || '';
        const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
        const readTime = Math.max(1, Math.ceil(wordCount / 200));

        // Extract excerpt
        const excerpt = wpPost.excerpt?.rendered
          ? wpPost.excerpt.rendered.replace(/<[^>]*>/g, '').trim()
          : content.replace(/<[^>]*>/g, '').substring(0, 160) + '...';

        const postData = {
          title: wpPost.title?.rendered || 'Untitled',
          slug: wpPost.slug,
          content: content,
          excerpt: excerpt,
          featuredImage,
          featuredImageAlt,
          status: 'PUBLISHED',
          authorId: authorId,
          publishedAt: wpPost.date ? new Date(wpPost.date).toISOString() : null,
          createdAt: new Date(wpPost.date || Date.now()).toISOString(),
          updatedAt: new Date(wpPost.modified || Date.now()).toISOString(),
          readTime,
          seoTitle: wpPost.yoast_head_json?.title || wpPost.title?.rendered,
          seoDescription: wpPost.yoast_head_json?.description || excerpt,
          views: 0,
        };

        // Check if post exists
        const { data: existing } = await supabase
          .from('posts')
          .select('*')
          .eq('slug', wpPost.slug)
          .single();

        if (existing) {
          await supabase
            .from('posts')
            .update(postData)
            .eq('id', existing.id);
          totalUpdated++;
        } else {
          await supabase
            .from('posts')
            .insert({ ...postData, id: randomUUID() });
          totalCreated++;
        }

      } catch (error: any) {
        console.error(`Error syncing post "${wpPost.title?.rendered}":`, error.message);
        totalErrors++;
      }
    }

    console.log(`✅ Page ${page} complete`);
    page++;

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n✅ Posts: ${totalCreated} created, ${totalUpdated} updated, ${totalErrors} errors`);
}

syncFromWordPress();
