// Database Content Audit Script
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== NEXT.JS DATABASE AUDIT ===\n');

  try {
    const counts = {
      posts: await prisma.posts.count(),
      pages: await prisma.pages.count(),
      categories: await prisma.categories.count(),
      tags: await prisma.tags.count(),
      users: await prisma.users.count(),
      videos: await prisma.videos.count(),
      podcasts: await prisma.podcasts.count(),
      magazines: await prisma.magazines.count(),
      media: await prisma.media.count(),
      comments: await prisma.comments.count(),
      subscriptions: await prisma.subscriptions.count(),
      newsletterSubscribers: await prisma.newsletter_subscribers.count(),
      contacts: await prisma.contacts.count(),
      products: await prisma.products.count(),
      orders: await prisma.orders.count(),
      payLinks: await prisma.pay_links.count(),
    };

    console.log('CONTENT:');
    console.log(`  Posts:                ${counts.posts.toLocaleString()}`);
    console.log(`  Pages:                ${counts.pages.toLocaleString()}`);
    console.log(`  Videos:               ${counts.videos.toLocaleString()}`);
    console.log(`  Podcasts:             ${counts.podcasts.toLocaleString()}`);
    console.log(`  Magazines:            ${counts.magazines.toLocaleString()}`);
    console.log(`  Categories:           ${counts.categories.toLocaleString()}`);
    console.log(`  Tags:                 ${counts.tags.toLocaleString()}`);
    console.log(`  Media Files:          ${counts.media.toLocaleString()}`);
    console.log(`  Comments:             ${counts.comments.toLocaleString()}`);

    console.log('\nUSERS & COMMUNITY:');
    console.log(`  Users:                ${counts.users.toLocaleString()}`);
    console.log(`  Newsletter Subscribers: ${counts.newsletterSubscribers.toLocaleString()}`);
    console.log(`  Subscriptions:        ${counts.subscriptions.toLocaleString()}`);
    console.log(`  CRM Contacts:         ${counts.contacts.toLocaleString()}`);

    console.log('\nE-COMMERCE:');
    console.log(`  Products:             ${counts.products.toLocaleString()}`);
    console.log(`  Orders:               ${counts.orders.toLocaleString()}`);
    console.log(`  Pay Links:            ${counts.payLinks.toLocaleString()}`);

    // Get subscription breakdown
    const subscriptionsByStatus = await prisma.subscriptions.groupBy({
      by: ['status'],
      _count: true,
    });

    if (subscriptionsByStatus.length > 0) {
      console.log('\nSUBSCRIPTION BREAKDOWN:');
      subscriptionsByStatus.forEach(s => {
        console.log(`  ${s.status.padEnd(15)}: ${s._count}`);
      });
    }

    // Get user roles
    const usersByRole = await prisma.users.groupBy({
      by: ['role'],
      _count: true,
    });

    if (usersByRole.length > 0) {
      console.log('\nUSER ROLES:');
      usersByRole.forEach(u => {
        console.log(`  ${u.role.padEnd(15)}: ${u._count}`);
      });
    }

    console.log('\n');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
