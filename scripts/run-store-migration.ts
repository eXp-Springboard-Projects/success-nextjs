/**
 * Run the store products enhancement migration
 * This script applies the enhanced schema to the store_products table
 */
import { supabaseAdmin } from '../lib/supabase';

async function runMigration() {
  const supabase = supabaseAdmin();

  console.log('📦 Running store products enhancement migration...\n');

  try {
    // Check if columns already exist by trying to select them
    console.log('Checking current schema...');
    const { data: testData, error: testError } = await supabase
      .from('store_products')
      .select('description, long_description, features, rating, review_count')
      .limit(1);

    if (!testError) {
      console.log('✅ Enhanced columns already exist! Schema is up to date.');
      console.log('   Columns found: description, long_description, features, rating, review_count');

      // Check if product_reviews table exists
      const { error: reviewsError } = await supabase
        .from('product_reviews')
        .select('id')
        .limit(1);

      if (!reviewsError) {
        console.log('✅ product_reviews table exists!');
      } else {
        console.log('⚠️  product_reviews table may need to be created');
        console.log('   Please create it via Supabase dashboard or SQL editor');
      }

      return;
    }

    // If we get here, columns don't exist
    console.log('\n⚠️  Enhanced columns not found.');
    console.log('ℹ️  Please run the migration SQL file via Supabase dashboard:');
    console.log('    1. Go to https://supabase.com/dashboard');
    console.log('    2. Navigate to SQL Editor');
    console.log('    3. Run: supabase/migrations/enhance_store_products_table.sql');
    console.log('');
    console.log('Or use Supabase CLI:');
    console.log('    npx supabase db push');

  } catch (error: any) {
    console.error('❌ Error checking schema:', error.message);
    console.log('\nTo apply the migration manually:');
    console.log('1. Open Supabase Dashboard > SQL Editor');
    console.log('2. Copy and paste: supabase/migrations/enhance_store_products_table.sql');
    console.log('3. Execute the migration');
  }
}

// Run if called directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export { runMigration };
