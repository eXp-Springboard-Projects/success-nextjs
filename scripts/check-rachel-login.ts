import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function checkRachelLogin() {
  try {
    console.log('🔍 Checking rachel.nead@success.com account...\n');

    // Get user from database
    const users = await prisma.$queryRaw<any[]>`
      SELECT id, email, name, password, role, avatar,
             "hasChangedDefaultPassword", "lastLoginAt", "createdAt"
      FROM users
      WHERE email = 'rachel.nead@success.com'
    `;

    const user = users[0];

    if (!user) {
      console.log('❌ User not found in database');
      console.log('\nChecking all admin users...');
      const allAdmins = await prisma.$queryRaw<any[]>`
        SELECT id, email, name, role
        FROM users
        WHERE role = 'ADMIN'
        ORDER BY email
      `;
      console.log('Admin users found:', allAdmins);
      return;
    }

    console.log('✅ User found:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Name:', user.name);
    console.log('  Role:', user.role);
    console.log('  Avatar:', user.avatar);
    console.log('  Has Changed Default Password:', user.hasChangedDefaultPassword);
    console.log('  Last Login:', user.lastLoginAt);
    console.log('  Created:', user.createdAt);
    console.log('  Password Hash Exists:', !!user.password);
    console.log('  Password Hash Length:', user.password?.length || 0);

    // Test password
    console.log('\n🔐 Testing password "Success2025!"...');
    const isValid = await bcrypt.compare('Success2025!', user.password);
    console.log('  Password Valid:', isValid ? '✅ YES' : '❌ NO');

    if (!isValid) {
      console.log('\n⚠️  Password does not match!');
      console.log('🔧 Generating new hash for "Success2025!"...');
      const newHash = await bcrypt.hash('Success2025!', 10);
      console.log('  New hash:', newHash);

      console.log('\n💡 To fix, run this script to update the password:');
      console.log('  DATABASE_URL="..." npx tsx scripts/update-rachel-password.ts');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRachelLogin();
