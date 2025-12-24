/**
 * Create Staff Test Accounts
 *
 * Creates 5 test accounts with different roles for staff testing:
 * - Admin (full access)
 * - Editor (manage all content)
 * - Author x2 (create own posts)
 * - Contributor (submit for review)
 *
 * Usage:
 *   npx tsx scripts/create-staff-accounts.ts
 */


import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface StaffAccount {
  name: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR';
  bio: string;
}

const STAFF_ACCOUNTS: StaffAccount[] = [
  {
    name: 'Admin User',
    email: 'admin@success.com',
    password: 'Success2025!',
    role: 'ADMIN',
    bio: 'Administrator account with full system access. Can manage all content, users, and settings.',
  },
  {
    name: 'Senior Editor',
    email: 'editor@success.com',
    password: 'Success2025!',
    role: 'EDITOR',
    bio: 'Senior editor with access to all posts. Can edit, publish, and manage content from all authors.',
  },
  {
    name: 'Sarah Martinez',
    email: 'author1@success.com',
    password: 'Success2025!',
    role: 'AUTHOR',
    bio: 'Staff writer specializing in entrepreneurship and business strategy. 5+ years writing about success stories and leadership.',
  },
  {
    name: 'James Chen',
    email: 'author2@success.com',
    password: 'Success2025!',
    role: 'AUTHOR',
    bio: 'Contributing author focused on personal development and productivity. Former tech executive turned writer.',
  },
  {
    name: 'Emily Rodriguez',
    email: 'contributor@success.com',
    password: 'Success2025!',
    role: 'AUTHOR',
    bio: 'Freelance contributor writing about wellness, work-life balance, and lifestyle topics.',
  },
];

async function createStaffAccounts() {
  console.log('👥 Creating Staff Test Accounts');
  console.log('================================\n');

  let created = 0;
  let existing = 0;

  for (const account of STAFF_ACCOUNTS) {
    try {
      // Check if user already exists
      const existingUser = await prisma.users.findUnique({
        where: { email: account.email }
      });

      if (existingUser) {
        console.log(`⚠️  ${account.email} - Already exists, updating...`);

        // Update existing user
        await prisma.users.update({
          where: { email: account.email },
          data: {
            name: account.name,
            password: await bcrypt.hash(account.password, 10),
            role: account.role,
            bio: account.bio,
            emailVerified: true,
            updatedAt: new Date(),
          },
        });
        existing++;
      } else {
        // Create new user
        await prisma.users.create({
          data: {
            id: randomUUID(),
            name: account.name,
            email: account.email,
            password: await bcrypt.hash(account.password, 10),
            role: account.role,
            bio: account.bio,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        console.log(`✅ ${account.email} - Created (${account.role})`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Failed to create ${account.email}:`, error);
    }
  }

  console.log('\n================================');
  console.log(`✅ Created: ${created} new accounts`);
  console.log(`⚠️  Updated: ${existing} existing accounts`);
  console.log(`📊 Total: ${created + existing} staff accounts ready\n`);

  // Display credentials
  console.log('📧 STAFF TEST CREDENTIALS');
  console.log('================================\n');

  for (const account of STAFF_ACCOUNTS) {
    console.log(`${account.role} - ${account.name}`);
    console.log(`  Email:    ${account.email}`);
    console.log(`  Password: ${account.password}`);
    console.log(`  Bio:      ${account.bio}`);
    console.log('');
  }

  console.log('================================');
  console.log('⚠️  IMPORTANT SECURITY NOTES:');
  console.log('================================');
  console.log('1. These are TEST accounts for staging/development only');
  console.log('2. NEVER use these credentials in production');
  console.log('3. Change all passwords before going live');
  console.log('4. Use strong, unique passwords for production');
  console.log('5. Enable 2FA for all production admin accounts\n');
}

async function displayRolePermissions() {
  console.log('🔐 ROLE PERMISSIONS');
  console.log('================================\n');

  console.log('ADMIN:');
  console.log('  ✅ Full system access');
  console.log('  ✅ Manage all posts (any author)');
  console.log('  ✅ Manage users and roles');
  console.log('  ✅ Manage categories, tags, media');
  console.log('  ✅ Access admin dashboard');
  console.log('  ✅ View analytics and reports');
  console.log('  ✅ Manage site settings');
  console.log('  ✅ Bulk actions on content\n');

  console.log('EDITOR:');
  console.log('  ✅ Edit and publish all posts');
  console.log('  ✅ Manage own posts');
  console.log('  ✅ Manage categories and tags');
  console.log('  ✅ Upload and manage media');
  console.log('  ✅ Access admin dashboard');
  console.log('  ❌ Cannot manage users');
  console.log('  ❌ Cannot change site settings\n');

  console.log('AUTHOR:');
  console.log('  ✅ Create and edit own posts');
  console.log('  ✅ Publish own posts');
  console.log('  ✅ Upload media for own posts');
  console.log('  ✅ Access own dashboard');
  console.log('  ❌ Cannot edit others\' posts');
  console.log('  ❌ Cannot manage users');
  console.log('  ❌ Cannot manage categories/tags\n');

  console.log('================================\n');
}

async function createSamplePosts() {
  console.log('📝 Creating Sample Posts for Each Author');
  console.log('================================\n');

  const authors = await prisma.users.findMany({
    where: {
      email: {
        in: ['author1@success.com', 'author2@success.com', 'contributor@success.com']
      }
    }
  });

  const samplePosts = [
    {
      authorEmail: 'author1@success.com',
      title: '5 Strategies Successful Entrepreneurs Use Daily',
      slug: '5-strategies-successful-entrepreneurs-use-daily',
      excerpt: 'Learn the daily habits and strategies that top entrepreneurs swear by for maintaining productivity and achieving their goals.',
      content: '<h2>Introduction</h2><p>Success isn\'t built overnight—it\'s the result of consistent daily habits and strategic thinking. After interviewing hundreds of successful entrepreneurs, we\'ve identified five key strategies they all have in common.</p><h2>1. Morning Routine Mastery</h2><p>The most successful entrepreneurs start their day with intention. Whether it\'s meditation, exercise, or planning, they own their mornings.</p><h2>2. Priority-Based Planning</h2><p>Instead of endless to-do lists, they focus on 3-5 high-impact priorities each day.</p><h2>3. Continuous Learning</h2><p>Reading, podcasts, courses—successful people never stop learning and growing.</p><h2>4. Network Cultivation</h2><p>They invest time in meaningful relationships and build their network strategically.</p><h2>5. Evening Reflection</h2><p>End-of-day reflection helps them learn from mistakes and celebrate wins.</p>',
      status: 'PUBLISHED',
    },
    {
      authorEmail: 'author2@success.com',
      title: 'The Productivity Myth: Why Working Less Can Achieve More',
      slug: 'productivity-myth-working-less-achieve-more',
      excerpt: 'Discover why the hustle culture might be holding you back, and how strategic rest can actually boost your productivity.',
      content: '<h2>The Hustle Trap</h2><p>We\'ve been sold a lie: that working 80-hour weeks is the only path to success. But research and real-world examples tell a different story.</p><h2>The Science of Rest</h2><p>Studies show that our brains need downtime to consolidate learning and spark creativity. The most innovative ideas often come during periods of rest.</p><h2>Quality Over Quantity</h2><p>It\'s not about how many hours you work—it\'s about the quality of those hours. Four focused hours can outperform twelve distracted ones.</p><h2>The Power of Boundaries</h2><p>Setting clear work-life boundaries actually makes you more productive when you are working.</p>',
      status: 'PUBLISHED',
    },
    {
      authorEmail: 'contributor@success.com',
      title: 'Creating Work-Life Harmony in a Remote World',
      slug: 'work-life-harmony-remote-world',
      excerpt: 'Remote work blurs the lines between personal and professional life. Here\'s how to create harmony instead of balance.',
      content: '<h2>Beyond Balance</h2><p>Work-life balance suggests a perfect 50/50 split. But that\'s not realistic or desirable. Instead, aim for harmony—where different parts of your life complement each other.</p><h2>Setting Boundaries at Home</h2><p>When your home is your office, physical and temporal boundaries become crucial. Create dedicated workspace and work hours.</p><h2>The Importance of Transitions</h2><p>In-office workers have commutes to transition. Remote workers need to create their own transition rituals.</p><h2>Staying Connected</h2><p>Remote work can be isolating. Make intentional efforts to stay connected with colleagues and maintain social relationships.</p>',
      status: 'DRAFT',
    },
  ];

  let created = 0;

  for (const post of samplePosts) {
    const author = authors.find(a => a.email === post.authorEmail);
    if (!author) continue;

    try {
      // Check if post exists
      const existing = await prisma.posts.findUnique({
        where: { slug: post.slug }
      });

      if (!existing) {
        await prisma.posts.create({
          data: {
            id: randomUUID(),
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            status: post.status as 'PUBLISHED' | 'DRAFT',
            authorId: author.id,
            publishedAt: post.status === 'PUBLISHED' ? new Date() : null,
            createdAt: new Date(),
            updatedAt: new Date(),
            readTime: 5,
          },
        });
        console.log(`  ✅ Created: "${post.title}" by ${author.name}`);
        created++;
      }
    } catch (error) {
      console.error(`  ❌ Failed to create post:`, error);
    }
  }

  console.log(`\n✅ Created ${created} sample posts for staff testing\n`);
}

async function main() {
  console.log('\n');

  try {
    await createStaffAccounts();
    await displayRolePermissions();
    await createSamplePosts();

    console.log('🎉 STAFF ACCOUNTS SETUP COMPLETE');
    console.log('================================\n');
    console.log('Next Steps:');
    console.log('1. Import sample content: npx tsx scripts/import-sample-content.ts');
    console.log('2. Deploy to staging environment');
    console.log('3. Send credentials to staff (via secure channel)');
    console.log('4. Begin 3-5 day testing period\n');

  } catch (error) {
    console.error('❌ Error creating staff accounts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run script
main();
