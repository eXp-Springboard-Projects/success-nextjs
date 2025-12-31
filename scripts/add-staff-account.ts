import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import readline from 'readline';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'SUCCESS123!';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function addStaffAccount() {
  console.log('\n═══════════════════════════════════════════');
  console.log('   SUCCESS Magazine - Add Staff Account');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Get email
    const email = await question('Email (@success.com): ');

    if (!email || !email.endsWith('@success.com')) {
      console.error('\n❌ Error: Email must end with @success.com');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.error('\n❌ Error: User with this email already exists');
      console.log('Email:', existingUser.email);
      console.log('Name:', existingUser.name);
      console.log('Role:', existingUser.role);
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Get name
    const name = await question('Full Name: ');

    if (!name) {
      console.error('\n❌ Error: Name is required');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Get role
    console.log('\nAvailable Roles:');
    console.log('1. EDITOR (default)');
    console.log('2. AUTHOR');
    console.log('3. ADMIN');
    console.log('4. SUPER_ADMIN (use with caution!)');

    const roleChoice = await question('\nSelect role (1-4, default 1): ');

    const roleMap: { [key: string]: string } = {
      '1': 'EDITOR',
      '2': 'AUTHOR',
      '3': 'ADMIN',
      '4': 'SUPER_ADMIN',
      '': 'EDITOR'
    };

    const role = roleMap[roleChoice] || 'EDITOR';

    // Confirm
    console.log('\n─────────────────────────────────────────');
    console.log('Please confirm:');
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('Role:', role);
    console.log('Default Password:', DEFAULT_PASSWORD);
    console.log('─────────────────────────────────────────');

    const confirm = await question('\nCreate this account? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
      console.log('\n❌ Operation cancelled');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Hash default password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Create user
    const user = await prisma.users.create({
      data: {
        id: uuidv4(),
        email,
        name,
        password: hashedPassword,
        role: role as any,
        emailVerified: true,
        hasChangedDefaultPassword: false,
        membershipTier: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('\n✅ STAFF ACCOUNT CREATED SUCCESSFULLY!\n');
    console.log('═══════════════════════════════════════════');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('🛡️  Role:', role);
    console.log('🔑 Default Password:', DEFAULT_PASSWORD);
    console.log('🆔 User ID:', user.id);
    console.log('═══════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT:');
    console.log('User will be required to change password on first login');
    console.log('Login URL: http://localhost:3000/admin/login\n');

  } catch (error) {
    console.error('\n❌ Error creating staff account:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

addStaffAccount();
