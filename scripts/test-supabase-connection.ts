/**
 * Test script to verify Supabase and Prisma database connections
 * Run with: npx tsx scripts/test-supabase-connection.ts
 */

import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';

async function testConnections() {
  console.log('🔍 Testing database connections...\n');

  // Test Prisma connection
  console.log('1️⃣ Testing Prisma connection...');
  try {
    const userCount = await prisma.users.count();
    console.log(`✅ Prisma connected! Found ${userCount} users in database`);
  } catch (error) {
    console.error('❌ Prisma connection failed:', error);
  }

  // Test Supabase connection (read-only query)
  console.log('\n2️⃣ Testing Supabase client connection...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Supabase query failed:', error.message);
    } else {
      console.log(`✅ Supabase connected! Database is accessible`);
    }
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
  }

  // Test raw query via Supabase
  console.log('\n3️⃣ Testing Supabase raw query...');
  try {
    const { data, error } = await supabase.rpc('version');

    if (error) {
      console.log('ℹ️  Raw query test skipped (function not available)');
    } else {
      console.log('✅ Raw queries work!', data);
    }
  } catch (error) {
    console.log('ℹ️  Raw query test skipped');
  }

  // Compare counts
  console.log('\n4️⃣ Comparing data between Prisma and Supabase...');
  try {
    const prismaCount = await prisma.users.count();
    const { count: supabaseCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    console.log(`   Prisma count: ${prismaCount}`);
    console.log(`   Supabase count: ${supabaseCount}`);

    if (prismaCount === supabaseCount) {
      console.log('✅ Both clients are reading from the same database!');
    } else {
      console.log('⚠️  Count mismatch - may need to investigate');
    }
  } catch (error) {
    console.error('❌ Comparison failed:', error);
  }

  console.log('\n✨ Connection tests complete!\n');

  await prisma.$disconnect();
}

testConnections();
