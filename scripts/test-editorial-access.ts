import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testEditorialAccess() {
  console.log('🧪 Testing Editorial Access...\n');

  // 1. Check if editorial user exists
  console.log('1️⃣ Checking editorial user...');
  const editorialUser = await prisma.users.findUnique({
    where: { email: 'editorial@success.com' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      primaryDepartment: true,
    }
  });

  if (!editorialUser) {
    console.log('❌ Editorial user NOT FOUND');
    console.log('Creating editorial user...');

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Editorial123!', 10);

    const newUser = await prisma.users.create({
      data: {
        id: `user_${Date.now()}`,
        email: 'editorial@success.com',
        password: hashedPassword,
        name: 'Editorial Staff',
        role: 'ADMIN',
        primaryDepartment: 'EDITORIAL',
      }
    });

    console.log('✅ Editorial user created:', newUser.email);
  } else {
    console.log('✅ Editorial user exists:', editorialUser.email);
    console.log('   Role:', editorialUser.role);
    console.log('   Department:', editorialUser.primaryDepartment);
  }

  // 2. Check posts count
  console.log('\n2️⃣ Checking posts...');
  const totalPosts = await prisma.posts.count();
  const publishedPosts = await prisma.posts.count({ where: { status: 'PUBLISHED' } });
  const draftPosts = await prisma.posts.count({ where: { status: 'DRAFT' } });

  console.log(`✅ Total posts: ${totalPosts}`);
  console.log(`   Published: ${publishedPosts}`);
  console.log(`   Draft: ${draftPosts}`);

  // 3. Get sample posts
  console.log('\n3️⃣ Sample posts:');
  const samplePosts = await prisma.posts.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      users: { select: { name: true } },
      categories: { select: { name: true } },
    }
  });

  samplePosts.forEach((post, i) => {
    console.log(`   ${i + 1}. ${post.title}`);
    console.log(`      Status: ${post.status} | Author: ${post.users.name}`);
    console.log(`      Categories: ${post.categories.map(c => c.name).join(', ')}`);
  });

  // 4. Check categories
  console.log('\n4️⃣ Checking categories...');
  const categoriesCount = await prisma.categories.count();
  console.log(`✅ Total categories: ${categoriesCount}`);

  // 5. Check tags
  console.log('\n5️⃣ Checking tags...');
  const tagsCount = await prisma.tags.count();
  console.log(`✅ Total tags: ${tagsCount}`);

  console.log('\n✅ All systems ready for Editorial staff!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: editorial@success.com');
  console.log('   Password: Editorial123!');
}

testEditorialAccess()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
