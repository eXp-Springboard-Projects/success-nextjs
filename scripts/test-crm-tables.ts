import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking CRM database tables...\n');

  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND (
      table_name LIKE '%contact%'
      OR table_name LIKE '%campaign%'
      OR table_name LIKE '%email%'
      OR table_name LIKE '%deal%'
      OR table_name LIKE '%ticket%'
      OR table_name LIKE '%lead%'
      OR table_name LIKE '%form%'
    )
    ORDER BY table_name
  `;

  console.log('Found tables:');
  tables.forEach(t => console.log(`  - ${t.table_name}`));
  console.log(`\nTotal: ${tables.length} tables\n`);

  // Check contacts table structure
  console.log('Checking contacts table...');
  const contactCount = await prisma.contacts.count();
  console.log(`  Contacts count: ${contactCount}`);

  // Check campaigns table
  console.log('\nChecking campaigns table...');
  const campaignCount = await prisma.campaigns.count();
  console.log(`  Campaigns count: ${campaignCount}`);

  // Check email_templates table
  console.log('\nChecking email_templates table...');
  const templateCount = await prisma.email_templates.count();
  console.log(`  Templates count: ${templateCount}`);

  // Check lead_scoring_rules table
  console.log('\nChecking lead_scoring_rules table...');
  const rulesCount = await prisma.lead_scoring_rules.count();
  console.log(`  Scoring rules count: ${rulesCount}`);

  // Check forms table
  console.log('\nChecking forms table...');
  const formsCount = await prisma.forms.count();
  console.log(`  Forms count: ${formsCount}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
