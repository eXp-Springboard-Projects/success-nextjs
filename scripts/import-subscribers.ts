import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

interface SubscriberRow {
  email: string;
  first_name?: string;
  last_name?: string;
  subscribed_date?: string;
  source?: string;
  tags?: string; // comma-separated
}

async function main() {
  const csvPath = process.argv[2] || './data/subscribers.csv';

  console.log(`Importing newsletter subscribers from: ${csvPath}\n`);

  // Read CSV file
  const csvContent = readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  }) as SubscriberRow[];

  console.log(`Found ${records.length} subscribers to import\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Get or create "Newsletter" contact list
  let newsletterList = await prisma.contact_lists.findFirst({
    where: { name: 'Newsletter Subscribers' },
  });

  if (!newsletterList) {
    newsletterList = await prisma.contact_lists.create({
      data: {
        id: nanoid(),
        name: 'Newsletter Subscribers',
        description: 'Imported from WordPress newsletter',
        type: 'STATIC',
        memberCount: 0,
        updatedAt: new Date(),
      },
    });
    console.log('✓ Created "Newsletter Subscribers" list\n');
  }

  for (const row of records) {
    try {
      // Validate email
      if (!row.email || !row.email.includes('@')) {
        skipped++;
        continue;
      }

      // Clean email
      const email = row.email.toLowerCase().trim();

      // Check if already exists as contact
      let contact = await prisma.contacts.findUnique({
        where: { email },
      });

      if (!contact) {
        // Create new contact
        contact = await prisma.contacts.create({
          data: {
            id: nanoid(),
            email,
            firstName: row.first_name || null,
            lastName: row.last_name || null,
            status: 'ACTIVE',
            source: row.source || 'WordPress Newsletter',
            leadScore: 0,
            createdAt: row.subscribed_date ? new Date(row.subscribed_date) : new Date(),
            updatedAt: new Date(),
          },
        });
      }

      // Add to newsletter list
      const existingMembership = await prisma.list_members.findFirst({
        where: {
          listId: newsletterList.id,
          contactId: contact.id,
        },
      });

      if (!existingMembership) {
        await prisma.list_members.create({
          data: {
            id: nanoid(),
            listId: newsletterList.id,
            contactId: contact.id,
          },
        });

        console.log(`✓ Added: ${email}`);
        imported++;
      } else {
        skipped++;
      }

      // Progress update
      if (imported % 1000 === 0) {
        console.log(`\n  Progress: ${imported}/${records.length} subscribers imported...\n`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      console.error(`✗ Error importing ${row.email}:`, error);
      errors++;
    }
  }

  // Update list member count
  const memberCount = await prisma.list_members.count({
    where: { listId: newsletterList.id },
  });

  await prisma.contact_lists.update({
    where: { id: newsletterList.id },
    data: { memberCount },
  });

  console.log('\n=== Import Complete ===');
  console.log(`✓ Imported: ${imported}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`✗ Errors: ${errors}`);
  console.log(`Total: ${records.length}`);
  console.log(`\nNewsletter list now has ${memberCount} subscribers`);
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
