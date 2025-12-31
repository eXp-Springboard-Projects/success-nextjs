/**
 * Create Staff Accounts
 *
 * Creates SUCCESS Magazine staff accounts with proper roles
 *
 * Usage:
 *   npx tsx scripts/create-staff-accounts.ts
 */

import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../lib/supabase';

interface StaffAccount {
  name: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR';
  bio?: string;
}

const STAFF_ACCOUNTS: StaffAccount[] = [
  {
    name: 'Rachel Nead',
    email: 'rachel.nead@success.com',
    password: 'Success2025!',
    role: 'SUPER_ADMIN',
    bio: 'Managing Director',
  },
  {
    name: 'Tyler Clayton',
    email: 'tyler.clayton@success.com',
    password: 'Success2025!',
    role: 'ADMIN',
    bio: 'Administrator',
  },
  {
    name: 'Glenn Sanford',
    email: 'glenn.sanford@success.com',
    password: 'Success2025!',
    role: 'SUPER_ADMIN',
    bio: 'Managing Director & Publisher',
  },
  {
    name: 'Senior Editor',
    email: 'editor@success.com',
    password: 'Success2025!',
    role: 'EDITOR',
    bio: 'Senior editor with access to all posts.',
  },
  {
    name: 'Sarah Martinez',
    email: 'sarah.martinez@success.com',
    password: 'Success2025!',
    role: 'AUTHOR',
    bio: 'Staff writer specializing in entrepreneurship and business strategy.',
  },
  {
    name: 'James Chen',
    email: 'james.chen@success.com',
    password: 'Success2025!',
    role: 'AUTHOR',
    bio: 'Contributing author focused on personal development and productivity.',
  },
];

async function createStaffAccounts() {
  console.log('👥 Creating SUCCESS Magazine Staff Accounts');
  console.log('================================\n');

  const supabase = supabaseAdmin();
  let created = 0;
  let existing = 0;

  for (const account of STAFF_ACCOUNTS) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', account.email.toLowerCase())
        .single();

      const hashedPassword = await bcrypt.hash(account.password, 10);
      const now = new Date().toISOString();

      if (existingUser) {
        console.log(`⚠️  ${account.email} - Already exists, updating password...`);

        // Update existing user
        await supabase
          .from('users')
          .update({
            password: hashedPassword,
            emailVerified: true,
            hasChangedDefaultPassword: false,
            updatedAt: now,
          })
          .eq('email', account.email.toLowerCase());
        existing++;
      } else {
        // Create new user
        await supabase
          .from('users')
          .insert({
            id: randomUUID(),
            name: account.name,
            email: account.email.toLowerCase(),
            password: hashedPassword,
            role: account.role,
            bio: account.bio,
            emailVerified: true,
            hasChangedDefaultPassword: false,
            createdAt: now,
            updatedAt: now,
          });

        console.log(`✅ ${account.email} - Created (${account.role})`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Failed to create ${account.email}:`, error);
    }
  }

  console.log('\n================================');
  console.log(`✅ Created: ${created} new accounts`);
  console.log(`⚠️  Updated: ${existing} existing accounts`);
  console.log(`📊 Total: ${created + existing} staff accounts ready\n`);

  // Display credentials
  console.log('📧 STAFF TEST CREDENTIALS');
  console.log('================================\n');

  for (const account of STAFF_ACCOUNTS) {
    console.log(`${account.role} - ${account.name}`);
    console.log(`  Email:    ${account.email}`);
    console.log(`  Password: ${account.password}`);
    console.log(`  Bio:      ${account.bio}`);
    console.log('');
  }

  console.log('================================');
  console.log('⚠️  IMPORTANT SECURITY NOTES:');
  console.log('================================');
  console.log('1. These are TEST accounts for staging/development only');
  console.log('2. NEVER use these credentials in production');
  console.log('3. Change all passwords before going live');
  console.log('4. Use strong, unique passwords for production');
  console.log('5. Enable 2FA for all production admin accounts\n');
}

async function displayRolePermissions() {
  console.log('🔐 ROLE PERMISSIONS');
  console.log('================================\n');

  console.log('ADMIN:');
  console.log('  ✅ Full system access');
  console.log('  ✅ Manage all posts (any author)');
  console.log('  ✅ Manage users and roles');
  console.log('  ✅ Manage categories, tags, media');
  console.log('  ✅ Access admin dashboard');
  console.log('  ✅ View analytics and reports');
  console.log('  ✅ Manage site settings');
  console.log('  ✅ Bulk actions on content\n');

  console.log('EDITOR:');
  console.log('  ✅ Edit and publish all posts');
  console.log('  ✅ Manage own posts');
  console.log('  ✅ Manage categories and tags');
  console.log('  ✅ Upload and manage media');
  console.log('  ✅ Access admin dashboard');
  console.log('  ❌ Cannot manage users');
  console.log('  ❌ Cannot change site settings\n');

  console.log('AUTHOR:');
  console.log('  ✅ Create and edit own posts');
  console.log('  ✅ Publish own posts');
  console.log('  ✅ Upload media for own posts');
  console.log('  ✅ Access own dashboard');
  console.log('  ❌ Cannot edit others\' posts');
  console.log('  ❌ Cannot manage users');
  console.log('  ❌ Cannot manage categories/tags\n');

  console.log('================================\n');
}


async function main() {
  console.log('\n');

  try {
    await createStaffAccounts();
    await displayRolePermissions();

    console.log('🎉 STAFF ACCOUNTS SETUP COMPLETE');
    console.log('================================\n');
    console.log('Staff can now log in at:');
    console.log('http://localhost:3000/admin/login\n');
    console.log('All staff can use password: Success2025!\n');

  } catch (error) {
    console.error('❌ Error creating staff accounts:', error);
    process.exit(1);
  }
}

// Run script
main();
