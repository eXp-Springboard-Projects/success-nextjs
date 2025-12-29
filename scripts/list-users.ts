import { supabaseAdmin } from '../lib/supabase';

async function listUsers() {
  const supabase = supabaseAdmin();

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, name, role, emailVerified, createdAt, lastLoginAt')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('❌ Error fetching users:', error);
    process.exit(1);
  }

  console.log('\n📋 ALL USER ACCOUNTS');
  console.log('='.repeat(80));
  console.log('');

  if (!users || users.length === 0) {
    console.log('No users found.');
    return;
  }

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name || 'No Name'}`);
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   👤 Role: ${user.role}`);
    console.log(`   ✅ Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
    console.log(`   📅 Created: ${new Date(user.createdAt).toLocaleString()}`);
    console.log(`   🔐 Last Login: ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log(`Total: ${users.length} user account${users.length !== 1 ? 's' : ''}\n`);

  // Group by role
  const roleGroups: Record<string, number> = {};
  users.forEach(u => {
    roleGroups[u.role] = (roleGroups[u.role] || 0) + 1;
  });

  console.log('👥 By Role:');
  Object.entries(roleGroups).forEach(([role, count]) => {
    console.log(`   ${role}: ${count}`);
  });
  console.log('');
}

listUsers();
