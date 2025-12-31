import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = 'sb_secret_bx9obYWu-6qwAoNavXVGCg_m3vemyQK';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listStaff() {
  console.log('\nFetching staff members...\n');

  // Get users with @success.com email
  const { data: staff, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', '%@success.com')
    .order('email');

  if (error) {
    console.error('Error fetching staff:', error);
    return;
  }

  console.log('='.repeat(80));
  console.log('SUCCESS.COM STAFF DIRECTORY');
  console.log('(Users with @success.com email addresses)');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Total Staff: ${staff.length}`);
  console.log('');
  console.log('─'.repeat(80));

  staff.forEach((s: any, i) => {
    const name = [s.firstName, s.first_name, s.lastName, s.last_name, s.name].filter(Boolean).join(' ') || 'Name not set';
    console.log('');
    console.log(`${i + 1}. ${name}`);
    console.log(`   Email: ${s.email}`);
    console.log(`   Role: ${s.role || 'Not assigned'}`);
    console.log(`   ID: ${s.id}`);
    if (s.createdAt || s.created_at) {
      console.log(`   Joined: ${new Date(s.createdAt || s.created_at).toLocaleDateString()}`);
    }
  });

  console.log('');
  console.log('─'.repeat(80));
  console.log('');
  console.log(`Total: ${staff.length} staff members`);
  console.log('');

  // Export to CSV format
  console.log('\n\nCSV FORMAT (for import):');
  console.log('─'.repeat(80));
  console.log('Email,Name,Role,ID,Created');
  staff.forEach((s: any) => {
    const name = [s.firstName, s.first_name, s.lastName, s.last_name, s.name].filter(Boolean).join(' ') || '';
    const role = s.role || '';
    const created = s.createdAt || s.created_at ? new Date(s.createdAt || s.created_at).toLocaleDateString() : '';
    console.log(`${s.email},${name},${role},${s.id},${created}`);
  });
}

listStaff().catch(console.error);
