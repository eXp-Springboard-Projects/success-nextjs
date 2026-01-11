import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQyODk0NywiZXhwIjoyMDgyMDA0OTQ3fQ.t4ADR0oV5sJCMNp1adP2vTsxV1W3Pfizw_uyO3BFYd4';

async function checkSchema() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Try to get one contact to see the columns
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample contact:', data[0]);
    console.log('\nColumn names:', Object.keys(data[0] || {}));
  }
}

checkSchema();
