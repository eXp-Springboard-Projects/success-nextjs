import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQyODk0NywiZXhwIjoyMDgyMDA0OTQ3fQ.t4ADR0oV5sJCMNp1adP2vTsxV1W3Pfizw_uyO3BFYd4';

async function checkPost() {
  console.log('🔍 Checking affiliate post: 25-minute-fitness-iron-bodyfit\n');

  // Check WordPress
  console.log('1️⃣ Checking WordPress API...');
  try {
    const wpResponse = await fetch(
      'https://successcom.wpenginepowered.com/wp-json/wp/v2/posts?slug=25-minute-fitness-iron-bodyfit&_embed'
    );
    const wpData = await wpResponse.json();

    if (wpData.length > 0) {
      const post = wpData[0];
      console.log('✅ FOUND in WordPress:');
      console.log(`   ID: ${post.id}`);
      console.log(`   Title: ${post.title.rendered}`);
      console.log(`   Status: ${post.status}`);
      console.log(`   Date: ${post.date}`);
      console.log(`   Type: ${post.type}`);
      console.log(`   Categories: ${post.categories.join(', ')}`);
    } else {
      console.log('❌ NOT FOUND in WordPress');
    }
  } catch (error) {
    console.error('Error fetching from WordPress:', error);
  }

  // Check Supabase
  console.log('\n2️⃣ Checking Supabase database...');
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, status, publishedAt, wordpressId')
    .eq('slug', '25-minute-fitness-iron-bodyfit')
    .single();

  if (error) {
    console.log('❌ NOT FOUND in database');
    console.log(`   Error: ${error.message}`);
  } else {
    console.log('✅ FOUND in database:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Title: ${data.title}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   WordPress ID: ${data.wordpressId}`);
    console.log(`   Published: ${data.publishedAt}`);
  }

  // Check total posts count
  console.log('\n3️⃣ Checking total posts in database...');
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  console.log(`   Total posts in database: ${count}`);
}

checkPost()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
