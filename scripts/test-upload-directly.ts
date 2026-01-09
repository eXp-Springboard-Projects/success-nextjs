/**
 * Test media upload functionality directly
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.development.local
const envPath = path.join(process.cwd(), '.env.development.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ Not set');
  process.exit(1);
}

async function testUpload() {
  console.log('Testing media table access...\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Test 1: Check if table exists
    console.log('1. Checking if media table exists...');
    const { data, error, count } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) {
      console.error('❌ Error accessing media table:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      return;
    }

    console.log('✅ Media table exists!');
    console.log(`   Total records: ${count || 0}`);

    if (data && data.length > 0) {
      console.log('   Sample records:');
      data.forEach((record: any) => {
        console.log(`   - ${record.filename} (${record.url})`);
      });
    }

    // Test 2: Check table structure
    console.log('\n2. Checking table structure...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'media' })
      .select();

    // If RPC doesn't exist, try to insert a test record to see what happens
    console.log('\n3. Testing insert permission...');
    const testRecord = {
      id: '00000000-0000-0000-0000-000000000000',
      filename: 'test.jpg',
      url: 'https://test.com/test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      uploadedBy: 'test-user',
    };

    const { data: insertData, error: insertError } = await supabase
      .from('media')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message);
      console.error('Error code:', insertError.code);
      console.error('Error details:', insertError.details);

      if (insertError.code === '23505') {
        console.log('ℹ️  This is expected (duplicate key) - table structure is OK');

        // Try to delete the test record
        await supabase
          .from('media')
          .delete()
          .eq('id', testRecord.id);
      } else if (insertError.code === '42703') {
        console.error('❌ Column missing in media table!');
        console.error('   This means the table schema is incomplete');
      }
    } else {
      console.log('✅ Insert test passed!');

      // Clean up test record
      await supabase
        .from('media')
        .delete()
        .eq('id', testRecord.id);
      console.log('✅ Cleaned up test record');
    }

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testUpload()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
