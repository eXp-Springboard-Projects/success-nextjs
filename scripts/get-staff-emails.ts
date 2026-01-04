import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getStaffEmails() {
  try {
    // Query users table for @success.com emails
    const users = await prisma.users.findMany({
      where: {
        email: {
          endsWith: '@success.com'
        }
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    console.log('\n=== Staff Members with @success.com emails ===\n');
    console.log(`Total found: ${users?.length || 0}\n`);

    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'Unknown'} <${user.email}>`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log(`   Created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}`);
        console.log('');
      });

      console.log('\n=== Email List ===');
      console.log(users.map(u => u.email).join('\n'));
    } else {
      console.log('No staff members found');
    }
  } catch (err) {
    console.error('Fatal error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

getStaffEmails();
