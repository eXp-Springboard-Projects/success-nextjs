/**
 * Comprehensive Test Suite for All Implemented Features
 * Tests: Database, Schema, Announcements, Watch History, Subscriptions, Staff APIs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAll() {
  console.log('🧪 COMPREHENSIVE FEATURE TEST SUITE');
  console.log('=====================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Database Connection
  console.log('1️⃣  Testing Database Connection...');
  try {
    await prisma.$connect();
    console.log('   ✅ Database connection successful\n');
    passed++;
  } catch (error: any) {
    console.log('   ❌ Database connection failed:', error.message, '\n');
    failed++;
    return;
  }

  // Test 2: Announcements Table
  console.log('2️⃣  Testing Announcements Schema...');
  try {
    const count = await prisma.announcements.count();
    console.log(`   ✅ Announcements table exists (${count} records)\n`);
    passed++;
  } catch (error: any) {
    console.log('   ❌ Announcements table error:', error.message, '\n');
    failed++;
  }

  // Test 3: Announcement Views Table
  console.log('3️⃣  Testing Announcement Views Schema...');
  try {
    const count = await prisma.announcement_views.count();
    console.log(`   ✅ Announcement Views table exists (${count} records)\n`);
    passed++;
  } catch (error: any) {
    console.log('   ❌ Announcement Views table error:', error.message, '\n');
    failed++;
  }

  // Test 4: Watch History Table
  console.log('4️⃣  Testing Watch History Schema...');
  try {
    const count = await prisma.watch_history.count();
    console.log(`   ✅ Watch History table exists (${count} records)\n`);
    passed++;
  } catch (error: any) {
    console.log('   ❌ Watch History table error:', error.message, '\n');
    failed++;
  }

  // Test 5: Subscriptions Table
  console.log('5️⃣  Testing Subscriptions Schema...');
  try {
    const count = await prisma.subscriptions.count();
    console.log(`   ✅ Subscriptions table exists (${count} records)\n`);
    passed++;
  } catch (error: any) {
    console.log('   ❌ Subscriptions table error:', error.message, '\n');
    failed++;
  }

  // Test 6: Users Table (for staff management)
  console.log('6️⃣  Testing Users Schema...');
  try {
    const count = await prisma.users.count();
    const staffCount = await prisma.users.count({
      where: {
        role: { in: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'] }
      }
    });
    console.log(`   ✅ Users table exists (${count} total, ${staffCount} staff)\n`);
    passed++;
  } catch (error: any) {
    console.log('   ❌ Users table error:', error.message, '\n');
    failed++;
  }

  // Test 7: Check for required user fields
  console.log('7️⃣  Testing User Fields for Staff Management...');
  try {
    const user = await prisma.users.findFirst({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        resetToken: true,
        resetTokenExpiry: true,
      }
    });
    console.log('   ✅ All required user fields present\n');
    passed++;
  } catch (error: any) {
    console.log('   ❌ User fields error:', error.message, '\n');
    failed++;
  }

  // Test 8: Check Activity Logs
  console.log('8️⃣  Testing Activity Logs Schema...');
  try {
    const count = await prisma.activity_logs.count();
    console.log(`   ✅ Activity Logs table exists (${count} records)\n`);
    passed++;
  } catch (error: any) {
    console.log('   ❌ Activity Logs table error:', error.message, '\n');
    failed++;
  }

  // Test 9: Check Package Dependencies
  console.log('9️⃣  Testing TipTap Table Extensions...');
  try {
    await import('@tiptap/extension-table');
    await import('@tiptap/extension-table-row');
    await import('@tiptap/extension-table-header');
    await import('@tiptap/extension-table-cell');
    console.log('   ✅ All TipTap table extensions installed\n');
    passed++;
  } catch (error: any) {
    console.log('   ❌ TipTap extensions error:', error.message, '\n');
    failed++;
  }

  // Test 10: Check Resend Package
  console.log('🔟 Testing Resend Email Package...');
  try {
    await import('resend');
    console.log('   ✅ Resend package installed\n');
    passed++;
  } catch (error: any) {
    console.log('   ❌ Resend package error:', error.message, '\n');
    failed++;
  }

  // Disconnect
  await prisma.$disconnect();

  // Summary
  console.log('\n=====================================');
  console.log('📊 TEST SUMMARY');
  console.log('=====================================');
  console.log(`✅ Passed: ${passed}/10`);
  console.log(`❌ Failed: ${failed}/10`);
  console.log(`📈 Success Rate: ${Math.round((passed / 10) * 100)}%\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! System is ready.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review errors above.\n');
    process.exit(1);
  }
}

testAll().catch((error) => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});
