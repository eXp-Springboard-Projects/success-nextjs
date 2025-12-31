import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing CRM data creation...\n');

  // 1. Create a contact
  console.log('1. Creating test contact...');
  const contact = await prisma.contacts.create({
    data: {
      id: nanoid(),
      email: `test-${Date.now()}@success.com`,
      firstName: 'Test',
      lastName: 'Contact',
      status: 'ACTIVE',
      source: 'Manual Test',
      leadScore: 0,
      updatedAt: new Date(),
    },
  });
  console.log(`   ✓ Created contact: ${contact.email} (ID: ${contact.id})`);

  // 2. Create an email template
  console.log('\n2. Creating test email template...');
  const template = await prisma.email_templates.create({
    data: {
      id: nanoid(),
      name: 'Test Newsletter Template',
      subject: 'Welcome to SUCCESS Magazine',
      content: '<h1>Welcome!</h1><p>Thank you for subscribing to SUCCESS Magazine.</p>',
      isDefault: false,
      updatedAt: new Date(),
    },
  });
  console.log(`   ✓ Created template: ${template.name} (ID: ${template.id})`);

  // 3. Create a contact list
  console.log('\n3. Creating test contact list...');
  const list = await prisma.contact_lists.create({
    data: {
      id: nanoid(),
      name: 'Test Newsletter List',
      description: 'Testing list for CRM',
      type: 'STATIC',
      memberCount: 0,
      updatedAt: new Date(),
    },
  });
  console.log(`   ✓ Created list: ${list.name} (ID: ${list.id})`);

  // Add contact to list
  await prisma.list_members.create({
    data: {
      id: nanoid(),
      listId: list.id,
      contactId: contact.id,
    },
  });
  console.log(`   ✓ Added contact to list`);

  // Update list member count
  await prisma.contact_lists.update({
    where: { id: list.id },
    data: { memberCount: 1 },
  });

  // 4. Create a campaign
  console.log('\n4. Creating test campaign...');
  const campaign = await prisma.campaigns.create({
    data: {
      id: nanoid(),
      name: 'Test Campaign - ' + new Date().toISOString(),
      subject: 'Test Email Campaign',
      status: 'DRAFT',
      templateId: template.id,
      updatedAt: new Date(),
    },
  });
  console.log(`   ✓ Created campaign: ${campaign.name} (ID: ${campaign.id})`);

  // Add contact to campaign
  await prisma.campaign_contacts.create({
    data: {
      id: nanoid(),
      campaignId: campaign.id,
      contactId: contact.id,
    },
  });
  console.log(`   ✓ Added contact to campaign`);

  // 5. Create a form
  console.log('\n5. Creating test form...');
  const form = await prisma.forms.create({
    data: {
      id: nanoid(),
      name: 'Test Lead Capture Form',
      fields: JSON.stringify([
        { id: '1', type: 'email', label: 'Email', name: 'email', required: true },
        { id: '2', type: 'text', label: 'First Name', name: 'firstName', required: true },
      ]),
      settings: JSON.stringify({ submitText: 'Subscribe' }),
      thankYouMessage: 'Thank you for subscribing!',
      listId: list.id,
      status: 'active',
      updatedAt: new Date(),
    },
  });
  console.log(`   ✓ Created form: ${form.name} (ID: ${form.id})`);

  // 6. Verify data
  console.log('\n6. Verifying data...');
  const contactCount = await prisma.contacts.count();
  const templateCount = await prisma.email_templates.count();
  const campaignCount = await prisma.campaigns.count();
  const formCount = await prisma.forms.count();
  const listCount = await prisma.contact_lists.count();

  console.log(`   Contacts: ${contactCount}`);
  console.log(`   Templates: ${templateCount}`);
  console.log(`   Campaigns: ${campaignCount}`);
  console.log(`   Forms: ${formCount}`);
  console.log(`   Lists: ${listCount}`);

  // 7. Test lead scoring update
  console.log('\n7. Testing lead scoring...');
  const updatedContact = await prisma.contacts.update({
    where: { id: contact.id },
    data: {
      leadScore: { increment: 25 },
      updatedAt: new Date(),
    },
  });
  console.log(`   ✓ Updated lead score to: ${updatedContact.leadScore}`);

  // 8. Create email event
  console.log('\n8. Creating email event...');
  await prisma.email_events.create({
    data: {
      id: nanoid(),
      campaignId: campaign.id,
      contactId: contact.id,
      emailAddress: contact.email,
      event: 'sent',
      eventData: { subject: campaign.subject },
    },
  });
  console.log(`   ✓ Created email event`);

  console.log('\n✅ All CRM functionality tests passed!\n');
  console.log('Summary of created test data:');
  console.log(`  - Contact: ${contact.email}`);
  console.log(`  - Template: ${template.name}`);
  console.log(`  - Campaign: ${campaign.name}`);
  console.log(`  - Form: ${form.name}`);
  console.log(`  - List: ${list.name}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
