import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  const email = 'admin@success.com';
  const password = 'Success2025!';

  try {
    console.log('🔍 Testing login for:', email);
    console.log('🔍 Password:', password);
    console.log('');

    // Simulate exact auth flow
    const users = await prisma.$queryRaw<any[]>`
      SELECT id, email, name, password, role, avatar,
             "hasChangedDefaultPassword", "lastLoginAt"
      FROM users
      WHERE email = ${email}
    `;

    console.log('📊 Query result count:', users.length);

    if (users.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = users[0];
    console.log('✅ User found:');
    console.log('  - Email:', user.email);
    console.log('  - Name:', user.name);
    console.log('  - Role:', user.role);
    console.log('  - Password hash (first 20 chars):', user.password.substring(0, 20) + '...');
    console.log('');

    console.log('🔐 Testing password comparison...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('  - bcrypt.compare result:', isPasswordValid);
    console.log('');

    if (!isPasswordValid) {
      console.log('❌ PASSWORD DOES NOT MATCH');
      console.log('');
      console.log('🔧 Generating new hash for comparison...');
      const newHash = await bcrypt.hash(password, 10);
      console.log('  - New hash (first 20 chars):', newHash.substring(0, 20) + '...');
      console.log('  - DB hash  (first 20 chars):', user.password.substring(0, 20) + '...');
      console.log('');
      console.log('⚠️  Hashes are different - password needs to be reset');
    } else {
      console.log('✅ PASSWORD MATCHES - login should work!');
      console.log('');
      console.log('If login still fails, check:');
      console.log('1. NEXTAUTH_SECRET in .env.local');
      console.log('2. Browser cookies/cache');
      console.log('3. Dev server is running');
      console.log('4. Check browser console for errors');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
