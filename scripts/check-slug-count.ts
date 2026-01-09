import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://aczlassjkbtwenzsohwm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQyODk0NywiZXhwIjoyMDgyMDA0OTQ3fQ.t4ADR0oV5sJCMNp1adP2vTsxV1W3Pfizw_uyO3BFYd4'
);

async function checkSlug() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', '25-minute-fitness-iron-bodyfit');

  console.log('Query result for slug "25-minute-fitness-iron-bodyfit":');
  console.log(`- Count: ${data?.length || 0}`);
  console.log(`- Error: ${error?.message || 'none'}`);

  if (data && data.length > 0) {
    data.forEach((p, i) => {
      console.log(`${i + 1}. ID: ${p.id}, Title: ${p.title.substring(0, 60)}`);
      console.log(`   Status: ${p.status}, Published: ${p.publishedAt}`);
    });
  }
}

checkSlug().then(() => process.exit(0));
