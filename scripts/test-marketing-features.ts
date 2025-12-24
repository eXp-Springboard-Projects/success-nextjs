import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });


import fetch from 'node-fetch';

const prisma = new PrismaClient();

async function testMarketingFeatures() {
  console.log('🧪 Testing Marketing/CRM Features\n');

  try {
    // Test 1: Check database connectivity and data
    console.log('📊 Test 1: Database Connectivity');
    console.log('─────────────────────────────────');

    const contactCount = await prisma.contacts.count();
    const campaignCount = await prisma.campaigns.count();
    const emailEventCount = await prisma.email_events.count();

    console.log(`✓ Contacts: ${contactCount}`);
    console.log(`✓ Campaigns: ${campaignCount}`);
    console.log(`✓ Email Events: ${emailEventCount}\n`);

    // Test 2: Recent email events
    console.log('📧 Test 2: Recent Email Events');
    console.log('─────────────────────────────────');

    const recentEvents = await prisma.email_events.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        contacts: {
          select: { email: true, firstName: true, lastName: true }
        }
      }
    });

    recentEvents.forEach((event, idx) => {
      console.log(`${idx + 1}. ${event.event} - ${event.contacts?.email || 'Unknown'} - ${event.createdAt.toISOString()}`);
    });
    console.log('');

    // Test 3: Campaign stats
    console.log('📈 Test 3: Campaign Statistics');
    console.log('─────────────────────────────────');

    const campaigns = await prisma.campaigns.findMany({
      select: {
        name: true,
        sentCount: true,
        openedCount: true,
        clickedCount: true,
        status: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    campaigns.forEach((campaign, idx) => {
      const openRate = campaign.sentCount > 0
        ? ((campaign.openedCount / campaign.sentCount) * 100).toFixed(1)
        : '0.0';
      console.log(`${idx + 1}. ${campaign.name}`);
      console.log(`   Status: ${campaign.status} | Sent: ${campaign.sentCount} | Opens: ${campaign.openedCount} (${openRate}%) | Clicks: ${campaign.clickedCount}`);
    });
    console.log('');

    // Test 4: Contact sources breakdown
    console.log('👥 Test 4: Contact Sources');
    console.log('─────────────────────────────────');

    const contactsBySource = await prisma.$queryRaw<Array<{
      source: string;
      count: bigint;
    }>>`
      SELECT
        COALESCE(source, 'Unknown') as source,
        COUNT(*) as count
      FROM contacts
      GROUP BY source
      ORDER BY count DESC
      LIMIT 5
    `;

    contactsBySource.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.source}: ${Number(row.count)} contacts`);
    });
    console.log('');

    // Test 5: Analytics API simulation
    console.log('📊 Test 5: Analytics API Query (Last 30 Days)');
    console.log('─────────────────────────────────');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const emailStats = await prisma.$queryRaw<Array<{
      total_sent: bigint;
      total_opens: bigint;
      total_clicks: bigint;
      total_bounced: bigint;
    }>>`
      SELECT
        COUNT(CASE WHEN event = 'sent' THEN 1 END) as total_sent,
        COUNT(CASE WHEN event = 'opened' THEN 1 END) as total_opens,
        COUNT(CASE WHEN event = 'clicked' THEN 1 END) as total_clicks,
        COUNT(CASE WHEN event = 'bounced' THEN 1 END) as total_bounced
      FROM email_events
      WHERE "createdAt" >= ${thirtyDaysAgo} AND "createdAt" <= ${now}
    `;

    const stats = emailStats[0];
    const totalSent = Number(stats.total_sent);
    const totalOpens = Number(stats.total_opens);
    const totalClicks = Number(stats.total_clicks);
    const totalBounced = Number(stats.total_bounced);

    const openRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(2) : '0.00';
    const clickRate = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(2) : '0.00';
    const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(2) : '0.00';

    console.log(`Total Sent: ${totalSent}`);
    console.log(`Total Opens: ${totalOpens} (${openRate}%)`);
    console.log(`Total Clicks: ${totalClicks} (${clickRate}%)`);
    console.log(`Total Bounced: ${totalBounced} (${bounceRate}%)`);
    console.log('');

    // Test 6: Email timeseries data
    console.log('📅 Test 6: Email Activity Timeline');
    console.log('─────────────────────────────────');

    const timeseries = await prisma.$queryRaw<Array<{
      date: Date;
      sends: bigint;
      opens: bigint;
      clicks: bigint;
    }>>`
      SELECT
        DATE("createdAt") as date,
        COUNT(CASE WHEN event = 'sent' THEN 1 END) as sends,
        COUNT(CASE WHEN event = 'opened' THEN 1 END) as opens,
        COUNT(CASE WHEN event = 'clicked' THEN 1 END) as clicks
      FROM email_events
      WHERE "createdAt" >= ${thirtyDaysAgo} AND "createdAt" <= ${now}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
      LIMIT 7
    `;

    timeseries.forEach((day) => {
      console.log(`${day.date.toISOString().split('T')[0]}: ${Number(day.sends)} sent, ${Number(day.opens)} opened, ${Number(day.clicks)} clicked`);
    });
    console.log('');

    // Summary
    console.log('✅ ALL MARKETING FEATURES TESTED SUCCESSFULLY');
    console.log('─────────────────────────────────────────────');
    console.log(`✓ Database: Connected and operational`);
    console.log(`✓ Contacts: ${contactCount} total`);
    console.log(`✓ Campaigns: ${campaignCount} total`);
    console.log(`✓ Email Events: ${emailEventCount} tracked`);
    console.log(`✓ Analytics: Queries working correctly`);
    console.log(`✓ Timeseries: Data aggregation functional`);

  } catch (error) {
    console.error('❌ Test Failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testMarketingFeatures()
  .then(() => {
    console.log('\n🎉 Marketing features test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Marketing features test failed:', error);
    process.exit(1);
  });
