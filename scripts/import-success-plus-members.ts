import { supabaseAdmin } from '../lib/supabase';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { nanoid } from 'nanoid';

interface CSVRow {
  'First Name': string;
  'Last Name': string;
  'Email': string;
  'Phone Number': string;
  'Create Date': string;
}

async function importSuccessPlusMembers() {
  const supabase = supabaseAdmin();

  // Read both CSV files
  const insiderCSV = readFileSync('C:\\Users\\RachelNead\\Downloads\\Contact List _ Paid S+ Insider.csv', 'utf-8');
  const collectiveCSV = readFileSync('C:\\Users\\RachelNead\\Downloads\\Contact List _ Paid S+ Collective.csv', 'utf-8');

  // Parse CSVs
  const insiderRecords: CSVRow[] = parse(insiderCSV, { columns: true, skip_empty_lines: true });
  const collectiveRecords: CSVRow[] = parse(collectiveCSV, { columns: true, skip_empty_lines: true });

  console.log(`Found ${insiderRecords.length} Insider members`);
  console.log(`Found ${collectiveRecords.length} Collective members`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Import Insider members
  for (const record of insiderRecords) {
    try {
      const email = record.Email?.trim().toLowerCase();
      if (!email) {
        console.log('Skipping record with no email');
        skipped++;
        continue;
      }

      // Check if member already exists
      const { data: existing } = await supabase
        .from('members')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        console.log(`Member already exists: ${email}`);
        skipped++;
        continue;
      }

      // Clean phone number
      let phone = record['Phone Number']?.trim() || null;
      if (phone) {
        phone = phone.replace(/\s+/g, ''); // Remove spaces
      }

      // Parse create date
      const createDate = record['Create Date'] ? new Date(record['Create Date']) : new Date();

      // Insert member
      const { error } = await supabase.from('members').insert({
        id: nanoid(),
        firstName: record['First Name']?.trim() || 'Unknown',
        lastName: record['Last Name']?.trim() || '',
        email: email,
        phone: phone,
        membershipTier: 'INSIDER', // All are Insider now
        membershipStatus: 'ACTIVE',
        joinDate: createDate.toISOString(),
        totalSpent: 0,
        lifetimeValue: 0,
        engagementScore: 0,
        createdAt: createDate.toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (error) {
        console.error(`Error importing ${email}:`, error.message);
        errors++;
      } else {
        console.log(`✓ Imported: ${record['First Name']} ${record['Last Name']} (${email})`);
        imported++;
      }
    } catch (err: any) {
      console.error('Error processing record:', err.message);
      errors++;
    }
  }

  // Import Collective members (also as Insider now)
  for (const record of collectiveRecords) {
    try {
      const email = record.Email?.trim().toLowerCase();
      if (!email) {
        console.log('Skipping record with no email');
        skipped++;
        continue;
      }

      // Check if member already exists
      const { data: existing } = await supabase
        .from('members')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        console.log(`Member already exists: ${email}`);
        skipped++;
        continue;
      }

      // Clean phone number
      let phone = record['Phone Number']?.trim() || null;
      if (phone) {
        phone = phone.replace(/\s+/g, '');
      }

      // Parse create date
      const createDate = record['Create Date'] ? new Date(record['Create Date']) : new Date();

      // Insert member
      const { error } = await supabase.from('members').insert({
        id: nanoid(),
        firstName: record['First Name']?.trim() || 'Unknown',
        lastName: record['Last Name']?.trim() || '',
        email: email,
        phone: phone,
        membershipTier: 'INSIDER', // All are Insider now
        membershipStatus: 'ACTIVE',
        joinDate: createDate.toISOString(),
        totalSpent: 0,
        lifetimeValue: 0,
        engagementScore: 0,
        createdAt: createDate.toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (error) {
        console.error(`Error importing ${email}:`, error.message);
        errors++;
      } else {
        console.log(`✓ Imported: ${record['First Name']} ${record['Last Name']} (${email})`);
        imported++;
      }
    } catch (err: any) {
      console.error('Error processing record:', err.message);
      errors++;
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`✓ Imported: ${imported}`);
  console.log(`- Skipped: ${skipped}`);
  console.log(`✗ Errors: ${errors}`);
  console.log(`Total: ${imported + skipped + errors}`);
}

importSuccessPlusMembers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
