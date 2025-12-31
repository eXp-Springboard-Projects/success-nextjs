const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default categories
  const categories = [
    { name: 'Business', slug: 'business', description: 'Business news and insights' },
    { name: 'Lifestyle', slug: 'lifestyle', description: 'Lifestyle and wellness' },
    { name: 'Money', slug: 'money', description: 'Finance and wealth building' },
    { name: 'Future of Work', slug: 'future-of-work', description: 'The evolving workplace' },
    { name: 'Health & Wellness', slug: 'health-wellness', description: 'Health and wellness tips' },
    { name: 'Entertainment', slug: 'entertainment', description: 'Entertainment news' },
  ];

  console.log('📁 Creating categories...');
  for (const cat of categories) {
    await prisma.categories.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Categories created');

  // Create admin user
  const adminEmail = 'admin@success.com';
  const adminPassword = 'ChangeMe123!'; // User should change this immediately

  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.users.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      bio: 'System administrator',
    },
  });

  console.log('✅ Admin user created');
  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📋 Login credentials:');
  console.log('   Email:', adminEmail);
  console.log('   Password:', adminPassword);
  console.log('');
  console.log('⚠️  IMPORTANT: Change the admin password after first login!');
  console.log('');
  console.log('🚀 Start the server with: npm run dev');
  console.log('🔐 Login at: http://localhost:3000/admin/login');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
