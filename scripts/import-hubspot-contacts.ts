import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

// Use direct Supabase client to bypass env var issues
const supabaseUrl = 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg4MjQyMCwiZXhwIjoyMDQ1NDU4NDIwfQ.sb_secret_bx9obYWu-6qwAoNavXVGCg_m3vemyQKqQwqYQX52OM';

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

async function importHubSpotContacts(csvPath: string) {
  const supabase = createClient(supabaseUrl, supabaseKey);
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
  let updated = 0;
  let errors = 0;

  // Process in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);

    console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(contacts.length / BATCH_SIZE)}...`);

    for (const contact of batch) {
      try {
        const email = contact.Email?.trim();

        if (!email) {
          skipped++;
          continue;
        }

        // Check if contact exists
        const { data: existing } = await supabase
          .from('contacts')
          .select('id, hubspot_id')
          .eq('email', email)
          .single();

        const contactData = {
          email,
          first_name: contact['First Name']?.trim() || null,
          last_name: contact['Last Name']?.trim() || null,
          phone: contact['Phone Number']?.trim() || null,
          street_address: contact['Street Address']?.trim() || null,
          lead_status: contact['Lead Status']?.trim() || 'new',
          marketing_status: contact['Marketing contact status']?.trim() || 'non-marketing',
          source: 'hubspot_import',
          hubspot_id: contact['Record ID']?.trim() || null,
          created_at: contact['Create Date'] ? new Date(contact['Create Date']).toISOString() : new Date().toISOString(),
        };

        if (existing) {
          // Update existing contact with HubSpot data
          const { error: updateError } = await supabase
            .from('contacts')
            .update({
              ...contactData,
              hubspot_id: contactData.hubspot_id || existing.hubspot_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error(`❌ Error updating ${email}:`, updateError.message);
            errors++;
          } else {
            updated++;
          }
        } else {
          // Create new contact
          const { error: insertError } = await supabase
            .from('contacts')
            .insert({
              id: nanoid(),
              ...contactData,
            });

          if (insertError) {
            console.error(`❌ Error inserting ${email}:`, insertError.message);
            errors++;
          } else {
            imported++;
          }
        }

        // Progress indicator
        if ((imported + updated + skipped + errors) % 100 === 0) {
          console.log(`   ✓ Processed ${imported + updated + skipped + errors} contacts...`);
        }
      } catch (error) {
        console.error(`❌ Error processing contact:`, error instanceof Error ? error.message : error);
        errors++;
      }
    }
  }

  console.log('\n✅ Import complete!');
  console.log(`   📥 Imported: ${imported}`);
  console.log(`   🔄 Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📊 Total: ${imported + updated + skipped + errors}`);
}

// Run import
const csvPath = process.argv[2] || 'c:/Users/RachelNead/Downloads/all-contacts.csv';

console.log('🚀 Starting HubSpot contacts import...');
console.log(`📁 CSV file: ${csvPath}\n`);

importHubSpotContacts(csvPath)
  .then(() => {
    console.log('\n✨ Import finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error);
    process.exit(1);
  });
