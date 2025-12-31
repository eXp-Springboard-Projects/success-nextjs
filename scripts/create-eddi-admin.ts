import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function createEddiAdmin() {
  const email = 'eddi.hughes@success.com';
  const name = 'Eddi Hughes';
  const password = 'Success2025!';

  try {
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Update existing user to ADMIN
      const updatedUser = await prisma.users.update({
        where: { email },
        data: {
          role: 'ADMIN',
          name: name,
          emailVerified: true,
        }
      });

      console.log('✅ Updated existing user to ADMIN:');
      console.log('Email:', updatedUser.email);
      console.log('Name:', updatedUser.name);
      console.log('Role:', updatedUser.role);
      console.log('\nPassword unchanged. Use forgot password if needed.');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin user
    const user = await prisma.users.create({
      data: {
        id: uuidv4(),
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: true,
        hasChangedDefaultPassword: false,
        membershipTier: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('\n✅ ADMIN ACCOUNT CREATED FOR EDDI HUGHES!\n');
    console.log('═══════════════════════════════════════════');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('🛡️  Role: ADMIN');
    console.log('🔑 Password:', password);
    console.log('🆔 User ID:', user.id);
    console.log('═══════════════════════════════════════════');
    console.log('\nAdmin Dashboard: /admin');

  } catch (error) {
    console.error('❌ Error creating admin account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createEddiAdmin();
