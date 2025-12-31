import { supabaseAdmin } from '../lib/supabase';

async function syncWordPressContent() {
  console.log('🔄 Starting WordPress content sync...\n');

  const apiUrl = 'http://localhost:3000/api/sync/wordpress';

  try {
    // Get an admin user ID from database
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

    console.log('Found admin user:', adminUser.id);

    // Sync categories first
    console.log('\n📁 Syncing categories...');
    const categoriesResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity: 'categories',
        limit: 100,
        offset: 0,
        dryRun: false,
      }),
    });

    if (!categoriesResponse.ok) {
      console.error('Categories sync failed:', await categoriesResponse.text());
    } else {
      const categoriesResult = await categoriesResponse.json();
      console.log('✅ Categories synced:', categoriesResult);
    }

    // Sync tags
    console.log('\n🏷️  Syncing tags...');
    const tagsResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity: 'tags',
        limit: 100,
        offset: 0,
        dryRun: false,
      }),
    });

    if (!tagsResponse.ok) {
      console.error('Tags sync failed:', await tagsResponse.text());
    } else {
      const tagsResult = await tagsResponse.json();
      console.log('✅ Tags synced:', tagsResult);
    }

    // Sync posts in batches
    console.log('\n📝 Syncing posts...');
    let offset = 0;
    const limit = 50;
    let hasMore = true;
    let totalCreated = 0;
    let totalUpdated = 0;

    while (hasMore) {
      console.log(`\nFetching posts ${offset} to ${offset + limit}...`);

      const postsResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'posts',
          limit,
          offset,
          dryRun: false,
        }),
      });

      if (!postsResponse.ok) {
        console.error('Posts sync failed:', await postsResponse.text());
        break;
      }

      const postsResult = await postsResponse.json();
      console.log(`✅ Batch complete - Created: ${postsResult.created}, Updated: ${postsResult.updated}, Errors: ${postsResult.errors.length}`);

      totalCreated += postsResult.created;
      totalUpdated += postsResult.updated;

      if (postsResult.errors.length > 0) {
        console.log('Errors:', postsResult.errors.slice(0, 5));
      }

      // If we got less than the limit, we've reached the end
      if (postsResult.total < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    console.log('\n✅ WordPress sync complete!');
    console.log(`📊 Total posts created: ${totalCreated}`);
    console.log(`📊 Total posts updated: ${totalUpdated}`);

  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

syncWordPressContent();
