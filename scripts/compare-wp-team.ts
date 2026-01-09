import { createClient } from '@supabase/supabase-js';
import { fetchWordPressData } from '../lib/wordpress';

const supabaseUrl = 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTg4MjQyMCwiZXhwIjoyMDQ1NDU4NDIwfQ.sb_secret_bx9obYWu-6qwAoNavXVGCg_m3vemyQKqQwqYQX52OM';

async function compareTeamMembers() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Checking WordPress team members...\n');

  // Fetch team members from WordPress API custom endpoint or ACF
  const wpTeamMembers = await fetchWordPressData('team-members?per_page=100');

  console.log(`WordPress has ${wpTeamMembers.length} team members\n`);

  if (wpTeamMembers.length > 0) {
    console.log('WordPress Team Members:');
    wpTeamMembers.forEach((member: any, i: number) => {
      console.log(`${i + 1}. ${member.title?.rendered || member.name} - ${member.acf?.role || member.role || 'No role'}`);
    });
  }

  // Check our database
  const { data: dbTeam, error } = await supabase
    .from('team_members')
    .select('*')
    .order('order_index', { ascending: true });

  console.log(`\n📊 Database has ${dbTeam?.length || 0} team members\n`);

  if (dbTeam && dbTeam.length > 0) {
    console.log('Database Team Members:');
    dbTeam.forEach((member: any, i: number) => {
      console.log(`${i + 1}. ${member.name} - ${member.role} (${member.status})`);
    });
  }

  if (error) {
    console.error('Error fetching from database:', error);
  }

  // Compare
  console.log('\n📈 Comparison:');
  console.log(`   WordPress: ${wpTeamMembers.length} members`);
  console.log(`   Database:  ${dbTeam?.length || 0} members`);
  console.log(`   Difference: ${Math.abs(wpTeamMembers.length - (dbTeam?.length || 0))} members`);
}

compareTeamMembers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
