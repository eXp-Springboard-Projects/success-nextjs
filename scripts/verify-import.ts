import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verifying WordPress import data...\n');

  // Members
  console.log('=== MEMBERS ===');
  const memberCount = await prisma.members.count();
  const activeMembers = await prisma.members.count({
    where: { membershipStatus: 'ACTIVE' },
  });
  const trialMembers = await prisma.members.count({
    where: { membershipTier: 'TRIAL' },
  });
  const premiumMembers = await prisma.members.count({
    where: { membershipTier: 'PREMIUM' },
  });

  console.log(`  Total members: ${memberCount}`);
  console.log(`  Active: ${activeMembers}`);
  console.log(`  Trial: ${trialMembers}`);
  console.log(`  Premium: ${premiumMembers}`);

  // Check for missing emails
  const membersNoEmail = await prisma.members.count({
    where: {
      OR: [
        { email: '' },
        { email: null },
      ],
    },
  });
  if (membersNoEmail > 0) {
    console.log(`  ⚠️  WARNING: ${membersNoEmail} members have no email`);
  }

  // Newsletter Subscribers
  console.log('\n=== NEWSLETTER SUBSCRIBERS ===');
  const newsletterList = await prisma.contact_lists.findFirst({
    where: { name: 'Newsletter Subscribers' },
  });

  if (newsletterList) {
    const subscriberCount = await prisma.list_members.count({
      where: { listId: newsletterList.id },
    });
    console.log(`  Newsletter list: ${subscriberCount} subscribers`);

    // Check active contacts
    const activeSubscribers = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT c.id) as count
      FROM contacts c
      JOIN list_members lm ON c.id = lm."contactId"
      WHERE lm."listId" = ${newsletterList.id}
        AND c.status = 'ACTIVE'
    `;
    console.log(`  Active contacts: ${Number(activeSubscribers[0].count)}`);
  } else {
    console.log(`  ⚠️  WARNING: Newsletter list not found`);
  }

  // Products
  console.log('\n=== PRODUCTS ===');
  const productCount = await prisma.products.count();
  const subscriptionProducts = await prisma.products.count({
    where: { isSubscription: true },
  });
  const inStockProducts = await prisma.products.count({
    where: { stock: { gt: 0 } },
  });

  console.log(`  Total products: ${productCount}`);
  console.log(`  Subscriptions: ${subscriptionProducts}`);
  console.log(`  In stock: ${inStockProducts}`);

  // Check for missing prices
  const productsNoPriceOrSku = await prisma.products.count({
    where: {
      OR: [
        { price: 0 },
        { sku: '' },
        { sku: null },
      ],
    },
  });
  if (productsNoPriceOrSku > 0) {
    console.log(`  ⚠️  WARNING: ${productsNoPriceOrSku} products missing price or SKU`);
  }

  // Blog Content
  console.log('\n=== BLOG CONTENT ===');
  const postCount = await prisma.posts.count();
  const publishedPosts = await prisma.posts.count({
    where: { status: 'PUBLISHED' },
  });
  const postsWithImages = await prisma.posts.count({
    where: {
      featuredImage: { not: null },
    },
  });

  console.log(`  Total posts: ${postCount}`);
  console.log(`  Published: ${publishedPosts}`);
  console.log(`  With featured image: ${postsWithImages}`);

  // Categories and Tags
  console.log('\n=== TAXONOMY ===');
  const categoryCount = await prisma.categories.count();
  const tagCount = await prisma.tags.count();

  console.log(`  Categories: ${categoryCount}`);
  console.log(`  Tags: ${tagCount}`);

  // Data Quality Checks
  console.log('\n=== DATA QUALITY ===');

  // Duplicate emails
  const duplicateEmails = await prisma.$queryRaw<Array<{ email: string; count: bigint }>>`
    SELECT email, COUNT(*) as count
    FROM members
    GROUP BY email
    HAVING COUNT(*) > 1
  `;

  if (duplicateEmails.length > 0) {
    console.log(`  ⚠️  WARNING: ${duplicateEmails.length} duplicate email addresses found`);
    duplicateEmails.slice(0, 5).forEach(d => {
      console.log(`    - ${d.email} (${Number(d.count)} times)`);
    });
  } else {
    console.log(`  ✓ No duplicate emails`);
  }

  // Missing Stripe IDs for active members
  const activeNoStripe = await prisma.members.count({
    where: {
      membershipStatus: 'ACTIVE',
      stripeCustomerId: null,
    },
  });

  if (activeNoStripe > 0) {
    console.log(`  ⚠️  WARNING: ${activeNoStripe} active members missing Stripe ID`);
  } else {
    console.log(`  ✓ All active members have Stripe IDs`);
  }

  // Expected Ranges
  console.log('\n=== VALIDATION ===');

  const checks = [
    { name: 'Members', count: memberCount, min: 500, max: 10000, status: '' },
    { name: 'Subscribers', count: newsletterList ? await prisma.list_members.count({ where: { listId: newsletterList.id } }) : 0, min: 10000, max: 200000, status: '' },
    { name: 'Products', count: productCount, min: 5, max: 100, status: '' },
    { name: 'Posts', count: postCount, min: 100, max: 10000, status: '' },
    { name: 'Categories', count: categoryCount, min: 5, max: 50, status: '' },
  ];

  checks.forEach(check => {
    if (check.count >= check.min && check.count <= check.max) {
      check.status = '✓';
    } else if (check.count < check.min) {
      check.status = '⚠️  LOW';
    } else {
      check.status = '⚠️  HIGH';
    }

    console.log(`  ${check.status} ${check.name}: ${check.count} (expected ${check.min}-${check.max})`);
  });

  console.log('\n=== Import Verification Complete ===');

  const allGood = checks.every(c => c.status === '✓') && duplicateEmails.length === 0;

  if (allGood) {
    console.log('\n✅ All checks passed! Ready for launch.\n');
  } else {
    console.log('\n⚠️  Some issues found. Review warnings above.\n');
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
