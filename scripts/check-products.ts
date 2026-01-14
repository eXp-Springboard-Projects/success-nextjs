import { supabaseAdmin } from '../lib/supabase';

async function checkProducts() {
  const supabase = supabaseAdmin();

  console.log('Checking product IDs and links...\n');

  const { data, error } = await supabase
    .from('store_products')
    .select('id, name, link, category')
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Sample products:');
  data?.forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.name}`);
    console.log(`   ID: ${p.id}`);
    console.log(`   Link: ${p.link}`);
    console.log(`   Category: ${p.category}`);
    console.log(`   Route would be: /store/${p.id}`);
  });
}

checkProducts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
