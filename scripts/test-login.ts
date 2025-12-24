
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  const testEmail = 'editor@success.com';

  try {
    const users = await prisma.$queryRaw<any[]>`
      SELECT id, email, name, password, role, avatar,
             "hasChangedDefaultPassword", "lastLoginAt", "isActive"
      FROM users
      WHERE email = ${testEmail}
    `;

    const user = users[0];

    if (!user) {
      console.log('❌ User not found:', testEmail);
      return;
    }

    console.log('✅ User found:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Name:', user.name);
    console.log('  Role:', user.role);
    console.log('  Active:', user.isActive);
    console.log('  Has password:', !!user.password);
    console.log('  Password length:', user.password?.length);

    // Test default password
    const defaultPassword = 'ChangeMe123!';
    const isDefaultValid = await bcrypt.compare(defaultPassword, user.password);
    console.log('\n🔐 Testing default password "ChangeMe123!":', isDefaultValid ? '✅ Valid' : '❌ Invalid');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
