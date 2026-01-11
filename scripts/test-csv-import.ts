import { createReadStream } from 'fs';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQyODk0NywiZXhwIjoyMDgyMDA0OTQ3fQ.t4ADR0oV5sJCMNp1adP2vTsxV1W3Pfizw_uyO3BFYd4';

const smartMapField = (header: string): string | null => {
  const lower = header.toLowerCase().replace(/[_\s-]/g, '');

  if (lower.includes('email')) return 'email';
  if (lower.includes('firstname') || lower.includes('givenname') || lower === 'fname' ||
      (header.toLowerCase().includes('first') && header.toLowerCase().includes('name'))) {
    return 'first_name';
  }
  if (lower.includes('lastname') || lower.includes('surname') || lower.includes('familyname') ||
      lower === 'lname' || (header.toLowerCase().includes('last') && header.toLowerCase().includes('name'))) {
    return 'last_name';
  }
  if (lower.includes('phone') || lower.includes('mobile') || lower.includes('cell') ||
      lower.includes('telephone') || lower === 'tel') {
    return 'phone';
  }
  if (lower.includes('company') || lower.includes('organization') || lower.includes('organisation') ||
      lower.includes('business')) {
    return 'company';
  }

  return null;
};

async function testImport() {
  const csvPath = 'C:/Users/RachelNead/Downloads/all-contacts.csv';

  console.log('Reading CSV:', csvPath);

  const fileStream = createReadStream(csvPath);

  Papa.parse(fileStream, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      const data = results.data as any[];
      const headers = results.meta.fields || [];

      console.log('\n📋 CSV Headers:', headers);
      console.log('📊 Total rows:', data.length);
      console.log('\n🔍 First row sample:', data[0]);

      // Map contacts
      const contacts = data.map(row => {
        const contact: any = {};

        headers.forEach(header => {
          const mappedField = smartMapField(header);
          if (mappedField && row[header]) {
            contact[mappedField] = row[header].trim();
          }
        });

        return contact;
      }).filter(c => Object.keys(c).length > 0);

      console.log('\n✅ Mapped first contact:', contacts[0]);
      console.log('📊 Total mapped contacts:', contacts.length);

      // Split
      const withEmail = contacts.filter(c => c.email);
      const withoutEmail = contacts.filter(c => !c.email);

      console.log('\n📧 With email:', withEmail.length);
      console.log('❌ Without email:', withoutEmail.length);

      // Test insert with just first 2 contacts
      const supabase = createClient(supabaseUrl, supabaseKey);
      const now = new Date().toISOString();
      const testContacts = withEmail.slice(0, 2).map(c => ({
        id: nanoid(),
        email: c.email,
        firstName: c.first_name || null,
        lastName: c.last_name || null,
        phone: c.phone || null,
        company: c.company || null,
        source: 'import',
        createdAt: now,
        updatedAt: now
      }));

      console.log('\n🧪 Testing insert with 2 contacts:', testContacts);

      const { data: inserted, error } = await supabase
        .from('contacts')
        .upsert(testContacts, {
          onConflict: 'email',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('\n❌ Error:', error);
      } else {
        console.log('\n✅ Success! Inserted:', inserted?.length);
      }

      process.exit(0);
    },
    error: (error) => {
      console.error('❌ Parse error:', error);
      process.exit(1);
    }
  });
}

testImport().catch(console.error);
