import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQyODk0NywiZXhwIjoyMDgyMDA0OTQ3fQ.t4ADR0oV5sJCMNp1adP2vTsxV1W3Pfizw_uyO3BFYd4';

async function countContacts() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { count, error } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Total contacts in database: ${count}`);
  }

  // Also get a few samples
  const { data: samples } = await supabase
    .from('contacts')
    .select('id, email, firstName, lastName, source, createdAt')
    .order('createdAt', { ascending: false })
    .limit(5);

  console.log('\nRecent 5 contacts:');
  samples?.forEach((c, i) => {
    console.log(`${i + 1}. ${c.email} - ${c.firstName || ''} ${c.lastName || ''} (${c.source})`);
  });
}

countContacts();
