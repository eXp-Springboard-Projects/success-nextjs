/**
 * Fix all product links to use internal routes
 */
import { supabaseAdmin } from '../lib/supabase';

async function fixProductLinks() {
  const supabase = supabaseAdmin();

  console.log('🔧 Fixing product links to internal routes...\n');

  // Fetch all products
  const { data: products, error } = await supabase
    .from('store_products')
    .select('id, name, link');

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${products?.length} products\n`);

  let updated = 0;
  let skipped = 0;

  for (const product of products || []) {
    // Skip if already has internal link
    if (product.link?.startsWith('/store/')) {
      skipped++;
      continue;
    }

    // Generate slug from name
    const slug = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Use product ID for the route
    const newLink = `/store/${product.id}`;

    // Update the product
    const { error: updateError } = await supabase
      .from('store_products')
      .update({ link: newLink })
      .eq('id', product.id);

    if (updateError) {
      console.error(`❌ Error updating ${product.name}:`, updateError.message);
    } else {
      console.log(`✅ ${product.name}: ${newLink}`);
      updated++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Link Fix Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Updated:  ${updated}`);
  console.log(`⏭️  Skipped:  ${skipped}`);
  console.log(`📦 Total:    ${products?.length}`);
  console.log('='.repeat(60));
}

// Run if called directly
if (require.main === module) {
  fixProductLinks()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export { fixProductLinks };
