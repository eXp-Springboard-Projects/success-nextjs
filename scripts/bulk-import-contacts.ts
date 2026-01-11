import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { supabaseAdmin } from '../lib/supabase';
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

async function bulkImportContacts(csvPath: string) {
  const supabase = supabaseAdmin();
  const contacts: HubSpotContact[] = [];

  console.log('📂 Reading CSV file...');

  // Parse CSV
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

  // Process in batches of 100
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

        // Check if contact exists
        const { data: existing } = await supabase
          .from('contacts')
          .select('id')
          .eq('email', email)
          .limit(1);

        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }

        const contactId = nanoid();

        // Create contact using exact same pattern as API
        const { error: contactError } = await supabase
          .from('contacts')
          .insert({
            id: contactId,
            email,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            company: null,
            source: 'import'
          });

        if (contactError) {
          console.error(`❌ Error importing ${email}:`, contactError.message);
          errors++;
        } else {
          imported++;
        }

        // Progress indicator
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

// Run import
const csvPath = process.argv[2] || 'c:/Users/RachelNead/Downloads/all-contacts.csv';

console.log('🚀 Starting HubSpot contacts bulk import...');
console.log(`📁 CSV file: ${csvPath}\n`);

bulkImportContacts(csvPath)
  .then(() => {
    console.log('\n✨ Import finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error);
    process.exit(1);
  });
