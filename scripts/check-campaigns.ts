import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });



const prisma = new PrismaClient();

async function checkCampaigns() {
  console.log('🔍 Checking Campaigns Table\n');

  try {
    const campaigns = await prisma.campaigns.findMany({
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        sentCount: true,
        openedCount: true,
        clickedCount: true,
        bouncedCount: true,
        failedCount: true,
        createdAt: true,
        sentAt: true,
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Total campaigns found: ${campaigns.length}\n`);

    campaigns.forEach((campaign, idx) => {
      const openRate = campaign.sentCount > 0
        ? ((campaign.openedCount / campaign.sentCount) * 100).toFixed(1)
        : '0.0';
      const clickRate = campaign.sentCount > 0
        ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1)
        : '0.0';

      console.log(`${idx + 1}. ${campaign.name}`);
      console.log(`   ID: ${campaign.id}`);
      console.log(`   Subject: ${campaign.subject}`);
      console.log(`   Status: ${campaign.status}`);
      console.log(`   Sent: ${campaign.sentCount}`);
      console.log(`   Opened: ${campaign.openedCount} (${openRate}%)`);
      console.log(`   Clicked: ${campaign.clickedCount} (${clickRate}%)`);
      console.log(`   Bounced: ${campaign.bouncedCount}`);
      console.log(`   Failed: ${campaign.failedCount}`);
      console.log(`   Created: ${campaign.createdAt.toISOString()}`);
      if (campaign.sentAt) {
        console.log(`   Sent At: ${campaign.sentAt.toISOString()}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkCampaigns()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  });
