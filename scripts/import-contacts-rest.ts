import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { nanoid } from 'nanoid';

interface HubSpotContact {
  'Record ID': string;
  'First Name': string;
  'Last Name': string;
  'Name': string;
  'Email': string;
  'Phone Number': string;
  'Lead Status': string;
  'Create Date': string;
  'Street Address': string;
  'Marketing contact status': string;
}

const SUPABASE_URL = 'https://aczlassjkbtwenzsohwm.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQyODk0NywiZXhwIjoyMDgyMDA0OTQ3fQ.t4ADR0oV5sJCMNp1adP2vTsxV1W3Pfizw_uyO3BFYd4';

async function importContacts(csvPath: string) {
  const contacts: HubSpotContact[] = [];

  console.log('📂 Reading CSV file...');

  const parser = createReadStream(csvPath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  );

  for await (const record of parser) {
    contacts.push(record as HubSpotContact);
  }

  console.log(`📊 Found ${contacts.length} contacts in CSV`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  const BATCH_SIZE = 100;
  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);

    console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(contacts.length / BATCH_SIZE)}...`);

    for (const contact of batch) {
      try {
        const email = contact.Email?.trim();
        const firstName = contact['First Name']?.trim() || null;
        const lastName = contact['Last Name']?.trim() || null;
        const phone = contact['Phone Number']?.trim() || null;

        if (!email) {
          skipped++;
          continue;
        }

        // Check if exists using REST API
        const checkResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/contacts?email=eq.${encodeURIComponent(email)}&select=id&limit=1`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
          }
        );

        const existing = await checkResponse.json();

        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }

        // Insert using REST API
        const insertResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/contacts`,
          {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              id: nanoid(),
              email,
              firstName: firstName,
              lastName: lastName,
              phone: phone,
              company: null,
              source: 'website',
              status: 'ACTIVE',
              emailEngagementScore: 0,
              leadScore: 0,
              tags: [],
              updatedAt: new Date().toISOString(),
            }),
          }
        );

        if (!insertResponse.ok) {
          const errorText = await insertResponse.text();
          console.error(`❌ Error importing ${email}:`, errorText.substring(0, 100));
          errors++;
        } else {
          imported++;
        }

        if ((imported + skipped + errors) % 100 === 0) {
          console.log(`   ✓ Processed ${imported + skipped + errors} contacts...`);
        }
      } catch (error) {
        console.error(`❌ Error processing contact:`, error instanceof Error ? error.message : error);
        errors++;
      }
    }
  }

  console.log('\n✅ Import complete!');
  console.log(`   📥 Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📊 Total: ${imported + skipped + errors}`);
}

const csvPath = process.argv[2] || 'c:/Users/RachelNead/Downloads/all-contacts.csv';

console.log('🚀 Starting HubSpot contacts import (REST API)...');
console.log(`📁 CSV file: ${csvPath}\n`);

importContacts(csvPath)
  .then(() => {
    console.log('\n✨ Import finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error);
    process.exit(1);
  });
