import { supabaseAdmin } from '../lib/supabase';

async function checkPostsCount() {
  const supabase = supabaseAdmin();

  // Get total count of all posts
  const { count: totalPosts, error: totalError } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  console.log('\n=== POSTS COUNT ===');
  console.log('Total posts in database:', totalPosts);

  if (totalError) {
    console.error('Error counting total posts:', totalError);
  }

  // Get count by status
  const { count: publishedCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PUBLISHED');

  const { count: draftCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'DRAFT');

  const { count: archivedCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ARCHIVED');

  console.log('\nBy Status:');
  console.log('  Published:', publishedCount);
  console.log('  Draft:', draftCount);
  console.log('  Archived:', archivedCount);

  // Check if posts have wordpressId (imported vs native)
  const { count: importedCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .not('wordpressId', 'is', null);

  const { count: nativeCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .is('wordpressId', null);

  console.log('\nBy Source:');
  console.log('  Imported from WordPress:', importedCount);
  console.log('  Created natively:', nativeCount);

  // Get latest post
  const { data: latestPost } = await supabase
    .from('posts')
    .select('title, createdAt, status')
    .order('createdAt', { ascending: false })
    .limit(1)
    .single();

  console.log('\nLatest Post:');
  console.log('  Title:', latestPost?.title);
  console.log('  Created:', latestPost?.createdAt);
  console.log('  Status:', latestPost?.status);

  console.log('\n');
}

checkPostsCount().catch(console.error);
