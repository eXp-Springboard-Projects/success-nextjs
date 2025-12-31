import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verifying CRM data in database...\n');

  // Query actual contacts
  console.log('=== CONTACTS ===');
  const contacts = await prisma.contacts.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  });
  contacts.forEach(c => {
    console.log(`  ${c.email} - Status: ${c.status}, Score: ${c.leadScore}, Source: ${c.source}`);
  });

  // Query actual templates
  console.log('\n=== EMAIL TEMPLATES ===');
  const templates = await prisma.email_templates.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  });
  templates.forEach(t => {
    console.log(`  ${t.name} - Subject: "${t.subject}"`);
  });

  // Query actual campaigns
  console.log('\n=== CAMPAIGNS ===');
  const campaigns = await prisma.campaigns.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      email_templates: true,
      campaign_contacts: {
        include: { contacts: true },
        take: 3,
      },
    },
  });
  campaigns.forEach(c => {
    console.log(`  ${c.name} - Status: ${c.status}, Template: ${c.email_templates?.name || 'None'}`);
    console.log(`    Recipients: ${c.campaign_contacts.length > 0 ? c.campaign_contacts.map(cc => cc.contacts.email).join(', ') : 'None'}`);
  });

  // Query actual forms
  console.log('\n=== FORMS ===');
  const forms = await prisma.forms.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  });
  forms.forEach(f => {
    const fields = JSON.parse(String(f.fields));
    console.log(`  ${f.name} - Status: ${f.status}, Fields: ${fields.length}, Submissions: ${f.submissions}`);
  });

  // Query lead scoring rules
  console.log('\n=== LEAD SCORING RULES ===');
  const rules = await prisma.lead_scoring_rules.findMany({
    orderBy: { points: 'desc' },
  });
  rules.forEach(r => {
    console.log(`  ${r.name} (${r.eventType}): ${r.points > 0 ? '+' : ''}${r.points} points - ${r.isActive ? 'Active' : 'Inactive'}`);
  });

  // Query email events
  console.log('\n=== EMAIL EVENTS ===');
  const events = await prisma.email_events.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      contacts: true,
      campaigns: true,
    },
  });
  events.forEach(e => {
    console.log(`  ${e.event.toUpperCase()} - ${e.contacts.email} - Campaign: ${e.campaigns.name}`);
  });

  // Query contact lists
  console.log('\n=== CONTACT LISTS ===');
  const lists = await prisma.contact_lists.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  });
  lists.forEach(l => {
    console.log(`  ${l.name} - Type: ${l.type}, Members: ${l.memberCount}`);
  });

  console.log('\n=== DATABASE STATISTICS ===');
  const stats = {
    contacts: await prisma.contacts.count(),
    activeContacts: await prisma.contacts.count({ where: { status: 'ACTIVE' } }),
    templates: await prisma.email_templates.count(),
    campaigns: await prisma.campaigns.count(),
    forms: await prisma.forms.count(),
    scoringRules: await prisma.lead_scoring_rules.count(),
    activeRules: await prisma.lead_scoring_rules.count({ where: { isActive: true } }),
    emailEvents: await prisma.email_events.count(),
    lists: await prisma.contact_lists.count(),
  };

  console.log(`  Total Contacts: ${stats.contacts} (${stats.activeContacts} active)`);
  console.log(`  Email Templates: ${stats.templates}`);
  console.log(`  Campaigns: ${stats.campaigns}`);
  console.log(`  Forms: ${stats.forms}`);
  console.log(`  Lead Scoring Rules: ${stats.scoringRules} (${stats.activeRules} active)`);
  console.log(`  Email Events: ${stats.emailEvents}`);
  console.log(`  Contact Lists: ${stats.lists}`);

  console.log('\n✅ CRM database verification complete!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
