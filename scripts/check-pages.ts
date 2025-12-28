import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_bx9obYWu-6qwAoNavXVGCg_m3vemyQK';

async function checkPages() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n📄 Checking Pages in Database\n');
  console.log('='.repeat(80));

  // Check if pages table exists and get all pages
  const { data: pages, error, count } = await supabase
    .from('pages')
    .select('*', { count: 'exact' })
    .order('createdAt', { ascending: false });

  if (error) {
    console.log('❌ Error querying pages table:', error.message);
    return;
  }

  console.log(`\n✅ Total pages in database: ${count || 0}\n`);

  if (!pages || pages.length === 0) {
    console.log('⚠️  No pages found in database!\n');
    console.log('Expected pages that should exist:');
    console.log('  - MAGAZINE');
    console.log('  - COACHING');
    console.log('  - LABS');
    console.log('  - SUCCESS+');
    console.log('  - PROFESSIONAL GROWTH');
    console.log('  - AI & TECHNOLOGY');
    console.log('  - BUSINESS & BRANDING');
    console.log('  - STORE');
    console.log('  - PRESS\n');
    return;
  }

  pages.forEach((page, index) => {
    console.log(`${index + 1}. ${page.title}`);
    console.log(`   Slug: ${page.slug}`);
    console.log(`   Status: ${page.status}`);
    console.log(`   Created: ${page.createdAt}`);
    console.log('');
  });

  console.log('='.repeat(80));
}

checkPages().catch(console.error);
