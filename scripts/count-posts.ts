import { supabaseAdmin } from '../lib/supabase';

async function countPosts() {
  const supabase = supabaseAdmin();

  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total posts in database: ${count}`);
}

countPosts();
