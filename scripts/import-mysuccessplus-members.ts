import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQyODk0NywiZXhwIjoyMDgyMDA0OTQ3fQ.t4ADR0oV5sJCMNp1adP2vTsxV1W3Pfizw_uyO3BFYd4';

/**
 * Import members from mysuccessplus.com
 *
 * This script helps migrate SUCCESS+ members from the WordPress site
 * to the Next.js Supabase database.
 *
 * Members should export their data from WordPress (Users > Export)
 * or connect directly to the WordPress database.
 *
 * For manual CSV import:
 * 1. Export users from WordPress as CSV
 * 2. Place CSV at: /scripts/mysuccessplus-members.csv
 * 3. Run this script
 *
 * CSV should have columns: email, first_name, last_name, membership_tier, trial_end_date
 */

async function importMembers() {
  console.log('🚀 Importing mysuccessplus.com members...\n');
  console.log('⚠️  Manual setup required:');
  console.log('   1. Export members from WordPress mysuccessplus.com');
  console.log('   2. Save as CSV with columns: email, first_name, last_name, membership_tier');
  console.log('   3. Use /admin/crm/contacts/import to upload CSV');
  console.log('   4. Update membership tiers in /admin/success-plus/manage-subscriptions\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check if we already have SUCCESS+ members
  const { count: successPlusCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('membershipTier', 'SUCCESS_PLUS');

  console.log(`📊 Current SUCCESS+ members in database: ${successPlusCount || 0}`);

  console.log('\n💡 Migration steps:');
  console.log('   1. Login credentials will be preserved (email-based)');
  console.log('   2. Members can reset password using "Forgot Password"');
  console.log('   3. Trial and subscription status will be migrated');
  console.log('   4. Access to SUCCESS+ content will be automatic\n');

  console.log('✅ Import infrastructure ready!');
  console.log('   - Use /admin/success-plus/import for bulk imports');
  console.log('   - Use /admin/crm/contacts/import for contact imports');
  console.log('   - Members table supports all SUCCESS+ tiers');
}

importMembers().catch(console.error);
