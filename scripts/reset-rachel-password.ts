import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function resetRachelPassword() {
  const email = 'rachel.nead@success.com';
  const newPassword = 'Success2025!';

  try {
    console.log('🔍 Looking for user:', email);

    // Check if user exists
    const existingUser = await prisma.$queryRaw<any[]>`
      SELECT id, email, name, role
      FROM users
      WHERE email = ${email}
    `;

    if (existingUser.length === 0) {
      console.log('❌ User not found. Creating new SUPER_ADMIN account...');

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.$executeRaw`
        INSERT INTO users (id, email, name, password, role, "hasChangedDefaultPassword", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          ${email},
          'Rachel Nead',
          ${hashedPassword},
          'SUPER_ADMIN',
          true,
          NOW(),
          NOW()
        )
      `;

      console.log('✅ Created SUPER_ADMIN account for', email);
    } else {
      console.log('✅ User found:', existingUser[0]);
      console.log('🔄 Resetting password...');

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.$executeRaw`
        UPDATE users
        SET password = ${hashedPassword},
            "updatedAt" = NOW(),
            "hasChangedDefaultPassword" = true
        WHERE email = ${email}
      `;

      console.log('✅ Password reset successful!');
    }

    console.log('\n🎉 SUCCESS! Login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('URL: https://www.success.com/admin/login');
    console.log('Email:', email);
    console.log('Password:', newPassword);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Verify the password works
    const verifyUser = await prisma.$queryRaw<any[]>`
      SELECT id, email, password
      FROM users
      WHERE email = ${email}
    `;

    if (verifyUser.length > 0) {
      const isValid = await bcrypt.compare(newPassword, verifyUser[0].password);
      console.log('\n🔐 Password verification:', isValid ? '✅ VALID' : '❌ INVALID');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetRachelPassword();
