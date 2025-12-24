/**
 * Audit Static vs Database Pages
 * Identifies which pages are hardcoded and which are in the database
 */


import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function auditPages() {
  console.log('🔍 AUDITING STATIC VS DATABASE PAGES\n');
  console.log('==========================================\n');

  // Get database pages
  console.log('📊 DATABASE PAGES:');
  console.log('------------------');
  const dbPages = await prisma.pages.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, title: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  dbPages.forEach((page, i) => {
    console.log(`${i + 1}. /${page.slug} - "${page.title}"`);
  });
  console.log(`\nTotal Published Pages in Database: ${dbPages.length}\n`);

  // List hardcoded pages
  console.log('\n📄 HARDCODED STATIC PAGES:');
  console.log('--------------------------');

  const staticPages = [
    // Marketing/Content Pages (SHOULD BE MIGRATED TO DATABASE)
    { file: 'about.tsx', path: '/about', priority: 'HIGH', reason: 'Content changes frequently' },
    { file: 'about-us.tsx', path: '/about-us', priority: 'HIGH', reason: 'Duplicate of /about' },
    { file: 'magazine.tsx', path: '/magazine', priority: 'HIGH', reason: 'Marketing content' },
    { file: 'subscribe.tsx', path: '/subscribe', priority: 'HIGH', reason: 'Marketing content' },
    { file: 'newsletter.tsx', path: '/newsletter', priority: 'HIGH', reason: 'Marketing content' },
    { file: 'contact.tsx', path: '/contact', priority: 'MEDIUM', reason: 'Contact form page' },
    { file: 'advertise.tsx', path: '/advertise', priority: 'MEDIUM', reason: 'Marketing content' },
    { file: 'press.tsx', path: '/press', priority: 'MEDIUM', reason: 'PR content' },
    { file: 'press-releases.tsx', path: '/press-releases', priority: 'MEDIUM', reason: 'PR content' },
    { file: 'help.tsx', path: '/help', priority: 'MEDIUM', reason: 'Help content' },
    { file: 'speakers.tsx', path: '/speakers', priority: 'MEDIUM', reason: 'Marketing content' },
    { file: 'coaching.tsx', path: '/coaching', priority: 'HIGH', reason: 'Product page' },
    { file: 'webinar.tsx', path: '/webinar', priority: 'MEDIUM', reason: 'Marketing content' },
    { file: 'bestsellers.tsx', path: '/bestsellers', priority: 'LOW', reason: 'Marketing content' },

    // Legal Pages (CAN BE MIGRATED BUT LOW PRIORITY)
    { file: 'privacy.tsx', path: '/privacy', priority: 'LOW', reason: 'Legal - rarely changes' },
    { file: 'terms.tsx', path: '/terms', priority: 'LOW', reason: 'Legal - rarely changes' },
    { file: 'accessibility.tsx', path: '/accessibility', priority: 'LOW', reason: 'Legal - rarely changes' },

    // Auth Pages (SHOULD STAY HARDCODED)
    { file: 'login.tsx', path: '/login', priority: 'N/A', reason: 'Auth flow - keep hardcoded' },
    { file: 'signin.tsx', path: '/signin', priority: 'N/A', reason: 'Auth flow - keep hardcoded' },
    { file: 'register.tsx', path: '/register', priority: 'N/A', reason: 'Auth flow - keep hardcoded' },
    { file: 'forgot-password.tsx', path: '/forgot-password', priority: 'N/A', reason: 'Auth flow - keep hardcoded' },
    { file: 'claim-account.tsx', path: '/claim-account', priority: 'N/A', reason: 'Auth flow - keep hardcoded' },

    // App Pages (SHOULD STAY HARDCODED)
    { file: 'index.tsx', path: '/', priority: 'N/A', reason: 'Homepage - complex logic' },
    { file: 'success-plus.tsx', path: '/success-plus', priority: 'N/A', reason: 'Member dashboard - keep hardcoded' },
    { file: 'upgrade.tsx', path: '/upgrade', priority: 'N/A', reason: 'Upgrade flow - keep hardcoded' },
    { file: 'search.tsx', path: '/search', priority: 'N/A', reason: 'Search functionality - keep hardcoded' },
  ];

  console.log('\n🔴 HIGH PRIORITY - Migrate to Database (Content changes frequently):');
  staticPages.filter(p => p.priority === 'HIGH').forEach(page => {
    console.log(`   • ${page.path} - ${page.reason}`);
  });

  console.log('\n🟡 MEDIUM PRIORITY - Migrate to Database (Occasionally updated):');
  staticPages.filter(p => p.priority === 'MEDIUM').forEach(page => {
    console.log(`   • ${page.path} - ${page.reason}`);
  });

  console.log('\n🟢 LOW PRIORITY - Can migrate but not urgent:');
  staticPages.filter(p => p.priority === 'LOW').forEach(page => {
    console.log(`   • ${page.path} - ${page.reason}`);
  });

  console.log('\n⚪ KEEP HARDCODED - Auth/App functionality:');
  staticPages.filter(p => p.priority === 'N/A').forEach(page => {
    console.log(`   • ${page.path} - ${page.reason}`);
  });

  // Summary
  const highPriority = staticPages.filter(p => p.priority === 'HIGH').length;
  const mediumPriority = staticPages.filter(p => p.priority === 'MEDIUM').length;
  const lowPriority = staticPages.filter(p => p.priority === 'LOW').length;
  const keepHardcoded = staticPages.filter(p => p.priority === 'N/A').length;

  console.log('\n\n==========================================');
  console.log('📈 SUMMARY:');
  console.log('==========================================');
  console.log(`Database Pages (Published): ${dbPages.length}`);
  console.log(`Static Pages (High Priority to Migrate): ${highPriority}`);
  console.log(`Static Pages (Medium Priority): ${mediumPriority}`);
  console.log(`Static Pages (Low Priority): ${lowPriority}`);
  console.log(`Static Pages (Keep Hardcoded): ${keepHardcoded}`);
  console.log(`\nTotal Pages Needing Migration: ${highPriority + mediumPriority + lowPriority}`);

  await prisma.$disconnect();
}

auditPages();
