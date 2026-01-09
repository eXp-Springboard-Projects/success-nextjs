/**
 * Test media upload for staff users
 * Diagnoses issues with media upload functionality
 */

import { supabaseAdmin } from '../lib/supabase';

async function testMediaUpload() {
  console.log('🔍 Testing Media Upload Configuration...\n');

  // 1. Check if Supabase admin client can be initialized
  try {
    const supabase = supabaseAdmin();
    console.log('✅ Supabase Admin client initialized');

    // 2. Test database connection
    const { data: tables, error: tablesError } = await supabase
      .from('media')
      .select('id')
      .limit(1);

    if (tablesError) {
      console.error('❌ Database connection failed:', tablesError.message);
      return;
    }
    console.log('✅ Database connection working');

    // 3. Test INSERT permission with admin client
    const testMedia = {
      id: '00000000-0000-0000-0000-000000000001',
      filename: 'test-upload.jpg',
      url: 'https://test.com/test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      alt: 'Test upload',
      uploadedBy: 'test-script',
    };

    const { data: insertData, error: insertError } = await supabase
      .from('media')
      .insert(testMedia)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Media INSERT failed:', insertError.message);
      console.error('   Details:', insertError.details);
      console.error('   Hint:', insertError.hint);
      return;
    }

    console.log('✅ Media INSERT successful');
    console.log('   Inserted:', insertData);

    // 4. Clean up test record
    await supabase
      .from('media')
      .delete()
      .eq('id', testMedia.id);

    console.log('✅ Test cleanup successful\n');

    // 5. Check user roles in database
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .in('role', ['EDITOR', 'AUTHOR', 'SOCIAL_TEAM'])
      .limit(10);

    if (usersError) {
      console.error('❌ Could not fetch users:', usersError.message);
    } else {
      console.log('\n📊 Staff Users in Database:');
      users?.forEach(user => {
        console.log(`   ${user.email} - ${user.role}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

testMediaUpload();
