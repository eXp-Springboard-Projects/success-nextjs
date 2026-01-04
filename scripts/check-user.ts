import { supabaseAdmin } from '@/lib/supabase';

async function checkUser() {
  const email = 'bagasramadhan88888@success.com';
  const supabase = supabaseAdmin();

  console.log(`Searching for user: ${email}\n`);

  // Check members table
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (memberError) {
    console.error('Error checking members table:', memberError);
  } else if (member) {
    console.log('=== FOUND IN MEMBERS TABLE ===');
    console.log('ID:', member.id);
    console.log('Name:', member.firstName, member.lastName);
    console.log('Email:', member.email);
    console.log('Membership Tier:', member.membershipTier);
    console.log('Membership Status:', member.membershipStatus);
    console.log('Created At:', member.createdAt);
    console.log('Total Spent:', member.totalSpent);
    console.log('Stripe Customer ID:', member.stripeCustomerId);
    console.log();
  } else {
    console.log('Not found in members table\n');
  }

  // Check users table
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (userError) {
    console.error('Error checking users table:', userError);
  } else if (user) {
    console.log('=== FOUND IN USERS TABLE ===');
    console.log('ID:', user.id);
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Department:', user.department);
    console.log('Created At:', user.createdAt);
    console.log('Email Verified:', user.emailVerified);
    console.log();
  } else {
    console.log('Not found in users table\n');
  }

  // List all users with similar patterns
  const { data: allUsers, error: allUsersError } = await supabase
    .from('users')
    .select('email, name, role, createdAt')
    .order('createdAt', { ascending: false });

  if (!allUsersError && allUsers) {
    console.log(`=== ALL USERS (${allUsers.length} total) ===`);
    allUsers.forEach(u => {
      console.log(`- ${u.email} | ${u.name || 'N/A'} | ${u.role || 'N/A'} | ${u.createdAt}`);
    });
  }
}

checkUser().catch(console.error);
