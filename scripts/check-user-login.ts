
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUserLogin() {
  const email = 'rachel.nead@success.com';
  const password = 'Success2025!';

  console.log('Checking user login for:', email);

  const user = await prisma.users.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      role: true,
      isActive: true,
      emailVerified: true,
      hasChangedDefaultPassword: true,
      lastLoginAt: true,
    }
  });

  if (!user) {
    console.log('❌ User NOT found in database');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ User found:');
  console.log('  - Name:', user.name);
  console.log('  - Email:', user.email);
  console.log('  - Role:', user.role);
  console.log('  - Active:', user.isActive);
  console.log('  - Email Verified:', user.emailVerified);
  console.log('  - Changed Default Password:', user.hasChangedDefaultPassword);
  console.log('  - Last Login:', user.lastLoginAt || 'Never');

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);
  console.log('\n🔑 Password check:', isValidPassword ? '✅ VALID' : '❌ INVALID');

  if (!isValidPassword) {
    console.log('\n💡 Password in database does not match "Success2025!"');
    console.log('   Try resetting the password to this value...');
  }

  await prisma.$disconnect();
}

checkUserLogin().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
