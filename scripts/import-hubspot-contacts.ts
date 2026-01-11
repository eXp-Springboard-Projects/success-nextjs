import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQyODk0NywiZXhwIjoyMDgyMDA0OTQ3fQ.t4ADR0oV5sJCMNp1adP2vTsxV1W3Pfizw_uyO3BFYd4';

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
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  });
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

  // Map contacts to database format
  const contactsToUpsert = contacts
    .filter(c => c.Email?.trim())
    .map(c => ({
      id: nanoid(),
      email: c.Email.trim(),
      first_name: c['First Name']?.trim() || null,
      last_name: c['Last Name']?.trim() || null,
      phone: c['Phone Number']?.trim() || null,
      company: null,
      source: 'import' as const,
    }));

  const skipped = contacts.length - contactsToUpsert.length;
  console.log(`⏭️  Skipped ${skipped} contacts without email\n`);

  // Bulk upsert
  console.log(`🔄 Upserting ${contactsToUpsert.length} contacts...`);
  const { data: upserted, error } = await supabase
    .from('contacts')
    .upsert(contactsToUpsert, {
      onConflict: 'email',
      ignoreDuplicates: false
    })
    .select();

  if (error) {
    throw error;
  }

  const imported = upserted?.length || 0;

  console.log('\n✅ Import complete!');
  console.log(`   ✓ Upserted: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📊 Total: ${imported + skipped}`);
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
