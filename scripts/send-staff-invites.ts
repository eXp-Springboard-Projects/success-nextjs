/**
 * Send invite codes to all staff members
 *
 * Usage:
 * 1. Edit the STAFF_EMAILS array below with your staff email addresses
 * 2. Run: DATABASE_URL="..." npx tsx scripts/send-staff-invites.ts
 *
 * All staff will receive EDITOR role by default
 * Super admins can change roles later in the admin dashboard
 */

import { PrismaClient } from '@prisma/client';
import { createInviteCode } from '../lib/auth-utils';
import { sendInviteCodeEmail } from '../lib/resend-email';

const prisma = new PrismaClient();

// ============================================
// EDIT THIS LIST WITH YOUR STAFF EMAILS
// ============================================
const STAFF_EMAILS = [
  'staff1@example.com',
  'staff2@example.com',
  'staff3@example.com',
  // Add more email addresses here
];

const SUPER_ADMIN_EMAIL = 'rachel.nead@exprealty.net'; // Change this to the current super admin email

async function sendStaffInvites() {
  console.log('📧 SENDING STAFF INVITATIONS\n');
  console.log('==========================================\n');

  // Get super admin ID to attribute invites
  const superAdmin = await prisma.users.findFirst({
    where: { email: SUPER_ADMIN_EMAIL },
    select: { id: true, name: true },
  });

  if (!superAdmin) {
    console.error(`❌ Super admin not found with email: ${SUPER_ADMIN_EMAIL}`);
    console.error('Please update SUPER_ADMIN_EMAIL in the script');
    await prisma.$disconnect();
    return;
  }

  const superAdminName = superAdmin.name || 'Admin';
  console.log(`✅ Found super admin: ${superAdminName}\n`);

  // Filter out emails that already have accounts
  const existingUsers = await prisma.users.findMany({
    where: {
      email: {
        in: STAFF_EMAILS,
      },
    },
    select: { email: true },
  });

  const existingEmails = existingUsers.map(u => u.email);
  const newStaffEmails = STAFF_EMAILS.filter(email => !existingEmails.includes(email));

  if (existingEmails.length > 0) {
    console.log('⚠️  SKIPPING EXISTING USERS:');
    existingEmails.forEach(email => {
      console.log(`   • ${email} (already has an account)`);
    });
    console.log('');
  }

  if (newStaffEmails.length === 0) {
    console.log('✅ All staff members already have accounts. No invites needed.\n');
    await prisma.$disconnect();
    return;
  }

  console.log(`📋 SENDING INVITES TO ${newStaffEmails.length} STAFF MEMBERS:\n`);

  const results = {
    success: [] as string[],
    failed: [] as { email: string; error: string }[],
  };

  // Send invites one by one
  for (const email of newStaffEmails) {
    try {
      console.log(`Processing: ${email}...`);

      // Create invite code
      const invite = await createInviteCode({
        email,
        role: 'EDITOR', // All staff start as EDITOR
        createdBy: superAdmin.id,
        expiresInDays: 30, // 30 days to accept invite
        maxUses: 1,
      });

      console.log(`   ✓ Invite code created: ${invite.code}`);

      // Send email
      const emailResult = await sendInviteCodeEmail(
        email,
        invite.code,
        superAdminName
      );

      if (emailResult.success) {
        console.log(`   ✓ Email sent successfully\n`);
        results.success.push(email);
      } else {
        console.log(`   ✗ Email failed: ${emailResult.error}\n`);
        results.failed.push({ email, error: emailResult.error || 'Unknown error' });
      }

    } catch (error: any) {
      console.log(`   ✗ Failed: ${error.message}\n`);
      results.failed.push({ email, error: error.message });
    }
  }

  // Summary
  console.log('\n==========================================');
  console.log('📊 SUMMARY');
  console.log('==========================================\n');
  console.log(`✅ Successfully sent: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}\n`);

  if (results.success.length > 0) {
    console.log('Successfully invited:');
    results.success.forEach(email => {
      console.log(`   • ${email}`);
    });
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log('❌ Failed to invite:');
    results.failed.forEach(({ email, error }) => {
      console.log(`   • ${email} - ${error}`);
    });
    console.log('');
  }

  console.log('📝 NEXT STEPS:');
  console.log('1. Staff members will receive invitation emails');
  console.log('2. They can register using their invite codes');
  console.log('3. All start with EDITOR role');
  console.log('4. Super admins can change roles at /admin/staff\n');

  await prisma.$disconnect();
}

sendStaffInvites().catch(console.error);
