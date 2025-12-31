import { supabaseAdmin } from '../lib/supabase';
import bcrypt from 'bcryptjs';

async function resetPassword() {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.log('Usage: npx tsx scripts/reset-user-password.ts <email> <new-password>');
    console.log('Example: npx tsx scripts/reset-user-password.ts user@success.com MyNewPass123');
    process.exit(1);
  }

  const [email, newPassword] = args;

  console.log(`Resetting password for: ${email}`);

  const supabase = supabaseAdmin();

  // Check if user exists
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('email', email.toLowerCase())
    .single();

  if (fetchError || !user) {
    console.error('❌ User not found:', email);
    process.exit(1);
  }

  console.log('✅ Found user:');
  console.log(`   Name: ${user.name}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   ID: ${user.id}`);

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  const { error: updateError } = await supabase
    .from('users')
    .update({
      password: hashedPassword,
      hasChangedDefaultPassword: true,
      updatedAt: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('❌ Error updating password:', updateError);
    process.exit(1);
  }

  console.log('✅ Password updated successfully!');
  console.log(`   Email: ${email}`);
  console.log(`   New Password: ${newPassword}`);
  console.log('');
  console.log('The user can now log in with this password.');
}

resetPassword();
