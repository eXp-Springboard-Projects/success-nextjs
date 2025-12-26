import { supabaseAdmin } from '../lib/supabase';

async function checkContent() {
  const supabase = supabaseAdmin();

  // Check posts
  const { data: posts, error: postsError, count: postsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  console.log('Posts:', postsCount || 0, postsError ? `Error: ${postsError.message}` : '');

  // Check pages
  const { data: pages, error: pagesError, count: pagesCount } = await supabase
    .from('pages')
    .select('*', { count: 'exact', head: true });

  console.log('Pages:', pagesCount || 0, pagesError ? `Error: ${pagesError.message}` : '');

  // Check videos
  const { data: videos, error: videosError, count: videosCount } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true });

  console.log('Videos:', videosCount || 0, videosError ? `Error: ${videosError.message}` : '');

  // Check podcasts
  const { data: podcasts, error: podcastsError, count: podcastsCount } = await supabase
    .from('podcasts')
    .select('*', { count: 'exact', head: true });

  console.log('Podcasts:', podcastsCount || 0, podcastsError ? `Error: ${podcastsError.message}` : '');

  // Get sample post if any exist
  if (postsCount && postsCount > 0) {
    const { data: samplePost } = await supabase
      .from('posts')
      .select('id, title, slug, status')
      .limit(1)
      .single();

    console.log('\nSample post:', samplePost);
  }
}

checkContent().catch(console.error);
