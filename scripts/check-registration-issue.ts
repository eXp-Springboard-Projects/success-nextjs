import { supabaseAdmin } from '../lib/supabase';

async function checkRegistrationIssue() {
  const supabase = supabaseAdmin();
  const testEmail = 'rachel.nead@exprealty.net';

  console.log('=== Checking Registration Issue ===\n');

  // 1. Check if user already exists
  console.log('1. Checking if user exists...');
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('*')
    .eq('email', testEmail)
    .single();

  if (existingUser) {
    console.log('❌ User ALREADY EXISTS:');
    console.log(JSON.stringify(existingUser, null, 2));
  } else if (checkError && checkError.code !== 'PGRST116') {
    console.log('Error checking user:', checkError);
  } else {
    console.log('✅ User does NOT exist\n');
  }

  // 2. Get actual table schema by inserting a test record
  console.log('2. Testing minimal insert to discover schema...');
  const testId = 'test_' + Date.now();

  const { data: testUser, error: insertError } = await supabase
    .from('users')
    .insert({
      id: testId,
      email: 'test_schema_check@example.com',
      password: 'hashed_password_here',
      first_name: 'Test',
      last_name: 'User',
      role: 'EDITOR',
      email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    console.log('❌ Insert error (this reveals schema issues):');
    console.log('Code:', insertError.code);
    console.log('Message:', insertError.message);
    console.log('Details:', insertError.details);
    console.log('Hint:', insertError.hint);
    console.log('Full error:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('✅ Test insert successful, schema is correct');
    console.log('Returned columns:', Object.keys(testUser));

    // Clean up test user
    await supabase.from('users').delete().eq('id', testId);
    console.log('✅ Test user cleaned up\n');
  }

  // 3. Try to query schema from information_schema
  console.log('3. Querying database schema...');
  const { data: columns, error: schemaError } = await supabase
    .rpc('get_table_columns', { table_name: 'users' })
    .select();

  if (schemaError) {
    console.log('Schema query not available (expected)');
  } else {
    console.log('Columns:', columns);
  }
}

checkRegistrationIssue()
  .then(() => {
    console.log('\n=== Check Complete ===');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
