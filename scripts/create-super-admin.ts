/**
 * Create Rachel's Super Admin Account
 *
 * Creates a SUPER_ADMIN account for Rachel Nead with secure random password
 */


import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Generate secure random password
function generateSecurePassword(): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*';

  const all = uppercase + lowercase + numbers + symbols;

  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill rest with random characters (total 16 chars)
  for (let i = 0; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function createSuperAdmin() {
  console.log('\n🔐 Creating Super Admin Account');
  console.log('================================\n');

  const email = 'rachel.nead@success.com';
  const password = generateSecurePassword();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Check if account already exists
    const existing = await prisma.users.findUnique({
      where: { email }
    });

    if (existing) {
      console.log('⚠️  Account already exists. Updating to SUPER_ADMIN...\n');

      await prisma.users.update({
        where: { email },
        data: {
          role: 'SUPER_ADMIN',
          password: hashedPassword,
          hasChangedDefaultPassword: true, // No forced password change for super admin
          emailVerified: true,
          updatedAt: new Date(),
        },
      });

      console.log('✅ Updated existing account to SUPER_ADMIN\n');
    } else {
      console.log('✅ Creating new SUPER_ADMIN account...\n');

      await prisma.users.create({
        data: {
          id: randomUUID(),
          name: 'Rachel Nead',
          email,
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          bio: 'SUCCESS Magazine - Chief Technology Officer',
          emailVerified: true,
          hasChangedDefaultPassword: true, // No forced password change
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log('✅ Account created successfully!\n');
    }

    // Display credentials
    console.log('🎉 SUPER ADMIN CREDENTIALS');
    console.log('================================');
    console.log('');
    console.log('  Name:     Rachel Nead');
    console.log('  Email:    rachel.nead@success.com');
    console.log(`  Password: ${password}`);
    console.log('  Role:     SUPER_ADMIN');
    console.log('');
    console.log('================================');
    console.log('');
    console.log('⚠️  IMPORTANT - SAVE THESE CREDENTIALS!');
    console.log('================================');
    console.log('1. Save the password in a secure password manager (1Password, LastPass, etc.)');
    console.log('2. This password will NOT be shown again');
    console.log('3. Do NOT share this password with anyone');
    console.log('4. Use this account for full system administration');
    console.log('5. No forced password change required');
    console.log('');
    console.log('🔐 Password Requirements Met:');
    console.log('  ✅ 16 characters long');
    console.log('  ✅ Contains uppercase letters');
    console.log('  ✅ Contains lowercase letters');
    console.log('  ✅ Contains numbers');
    console.log('  ✅ Contains symbols');
    console.log('  ✅ Randomly generated');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
