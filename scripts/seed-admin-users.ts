import { PrismaClient, Department } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function seedAdminUsers() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║      SUCCESS Magazine - Seed Admin Users       ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const adminUsers = [
    {
      id: 'user_admin_rachel',
      email: 'rachel.nead@success.com',
      name: 'Rachel Nead',
      password: 'Admin123!',
      role: 'SUPER_ADMIN' as const,
      departments: [
        Department.SUPER_ADMIN,
        Department.EDITORIAL,
        Department.CUSTOMER_SERVICE,
        Department.DEV,
        Department.MARKETING,
        Department.COACHING,
        Department.SUCCESS_PLUS
      ],
      title: 'Chief Executive Officer',
      bio: 'CEO of SUCCESS Magazine',
    },
    {
      id: 'user_admin_editorial',
      email: 'editorial@success.com',
      name: 'Editorial Director',
      password: 'Editorial123!',
      role: 'ADMIN' as const,
      departments: [Department.EDITORIAL],
      title: 'Editorial Director',
      bio: 'Manages all editorial content and writers',
    },
    {
      id: 'user_admin_cs',
      email: 'support@success.com',
      name: 'Customer Service Lead',
      password: 'Support123!',
      role: 'ADMIN' as const,
      departments: [Department.CUSTOMER_SERVICE],
      title: 'Customer Service Director',
      bio: 'Handles customer support, refunds, and subscriptions',
    },
    {
      id: 'user_admin_dev',
      email: 'dev@success.com',
      name: 'DevOps Engineer',
      password: 'DevOps123!',
      role: 'ADMIN' as const,
      departments: [Department.DEV],
      title: 'DevOps Lead',
      bio: 'Manages system infrastructure and deployments',
    },
    {
      id: 'user_admin_marketing',
      email: 'marketing@success.com',
      name: 'Marketing Director',
      password: 'Marketing123!',
      role: 'ADMIN' as const,
      departments: [Department.MARKETING],
      title: 'Marketing Director',
      bio: 'Leads marketing campaigns and growth initiatives',
    },
    {
      id: 'user_admin_coaching',
      email: 'coaching@success.com',
      name: 'Coaching Director',
      password: 'Coaching123!',
      role: 'ADMIN' as const,
      departments: [Department.COACHING],
      title: 'Coaching Programs Director',
      bio: 'Manages coaching programs and sessions',
    },
    {
      id: 'user_admin_successplus',
      email: 'successplus@success.com',
      name: 'SUCCESS+ Manager',
      password: 'SuccessPlus123!',
      role: 'ADMIN' as const,
      departments: [Department.SUCCESS_PLUS],
      title: 'SUCCESS+ Content Manager',
      bio: 'Manages premium SUCCESS+ content and members',
    },
  ];

  console.log(`Creating ${adminUsers.length} admin users...\n`);

  for (const userData of adminUsers) {
    try {
      // Check if user already exists
      const existingUser = await prisma.users.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`→ User already exists: ${userData.email}`);
        continue;
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = await prisma.users.create({
        data: {
          id: userData.id,
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
          jobTitle: userData.title,
          bio: userData.bio,
          emailVerified: true,
          isActive: true,
          primaryDepartment: userData.departments[0],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Assign to departments
      for (const dept of userData.departments) {
        await prisma.staff_departments.create({
          data: {
            userId: user.id,
            department: dept,
            assignedBy: 'system',
            assignedAt: new Date(),
          },
        });
      }

      console.log(`✓ Created: ${userData.name} (${userData.email})`);
      console.log(`  Role: ${userData.role}`);
      console.log(`  Departments: ${userData.departments.join(', ')}`);
      console.log(`  Password: ${userData.password}\n`);

    } catch (error: any) {
      console.error(`✗ Failed to create ${userData.email}:`, error.message);
    }
  }

  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║           ADMIN USERS CREATED! ✓                ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Show summary
  const userCount = await prisma.users.count();
  const superAdminCount = await prisma.users.count({ where: { role: 'SUPER_ADMIN' } });
  const adminCount = await prisma.users.count({ where: { role: 'ADMIN' } });

  console.log('Summary:');
  console.log(`  Total Users:   ${userCount}`);
  console.log(`  Super Admins:  ${superAdminCount}`);
  console.log(`  Admins:        ${adminCount}\n`);

  console.log('Login Credentials:');
  console.log('─────────────────────────────────────────────────');
  for (const user of adminUsers) {
    console.log(`${user.email.padEnd(30)} → ${user.password}`);
  }
  console.log('─────────────────────────────────────────────────\n');

  console.log('Next Steps:');
  console.log('  1. Visit: http://localhost:3000/admin/login');
  console.log('  2. Login with any of the credentials above');
  console.log('  3. Test department access and permissions\n');
}

async function main() {
  try {
    await seedAdminUsers();
  } catch (error) {
    console.error('\n✗ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
