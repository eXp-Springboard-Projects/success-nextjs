import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUserLogin() {
  try {
    // Use raw query to bypass schema issues
    const users = await prisma.$queryRaw<any[]>`
      SELECT id, email, name, password, role, "hasChangedDefaultPassword", "createdAt"
      FROM users
      WHERE email = 'admin@success.com'
    `;

    if (users.length === 0) {
      console.log('❌ User admin@success.com NOT found in database');
      console.log('\nCreating admin user...');

      const hashedPassword = await bcrypt.hash('Success2025!', 10);

      await prisma.$executeRaw`
        INSERT INTO users (id, email, name, password, role, "hasChangedDefaultPassword", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          'admin@success.com',
          'Admin',
          ${hashedPassword},
          'ADMIN',
          false,
          NOW(),
          NOW()
        )
      `;

      console.log('✅ Admin user created!');
      return;
    }

    const user = users[0];
    console.log('✅ User found in database:');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Created:', user.createdAt);
    console.log('Has Changed Password:', user.hasChangedDefaultPassword);

    // Test password
    const testPassword = 'Success2025!';
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);

    console.log('\n🔐 Password Test:');
    console.log('Test Password:', testPassword);
    console.log('Password Valid:', isPasswordValid ? '✅ YES' : '❌ NO');

    if (!isPasswordValid) {
      console.log('\n⚠️ Password does not match. Resetting password...');
      const newHashedPassword = await bcrypt.hash(testPassword, 10);

      await prisma.$executeRaw`
        UPDATE users
        SET password = ${newHashedPassword}, "updatedAt" = NOW()
        WHERE email = 'admin@success.com'
      `;

      console.log('✅ Password has been reset to: Success2025!');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserLogin();
