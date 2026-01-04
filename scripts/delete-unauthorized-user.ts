import { supabaseAdmin } from '@/lib/supabase';

async function deleteUnauthorizedUser() {
  const email = 'bagasramadhan88888@success.com';
  const supabase = supabaseAdmin();

  console.log(`\n🔒 Deleting unauthorized user: ${email}\n`);

  // First check if user exists
  const { data: user, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (findError) {
    console.error('❌ Error checking for user:', findError);
    process.exit(1);
  }

  if (!user) {
    console.log('✅ User not found in database (may have been deleted already)');
    process.exit(0);
  }

  console.log('Found user:');
  console.log('  ID:', user.id);
  console.log('  Name:', user.name);
  console.log('  Email:', user.email);
  console.log('  Role:', user.role);
  console.log('  Created:', user.createdAt);
  console.log();

  // Delete the user
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('email', email);

  if (deleteError) {
    console.error('❌ Failed to delete user:', deleteError);
    process.exit(1);
  }

  console.log('✅ User successfully deleted from database');
  console.log('⚠️  Note: If they have an active session, it will expire in 8 hours or when they log out');
}

deleteUnauthorizedUser().catch(console.error);
