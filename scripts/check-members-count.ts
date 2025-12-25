import { createClient } from '@supabase/supabase-js';

async function checkMembers() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error, count } = await supabase
    .from('members')
    .select('*', { count: 'exact' })
    .eq('membershipTier', 'SUCCESSPlus');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total SUCCESS+ members: ${count}`);
  console.log('\nFirst 5 members:');
  data?.slice(0, 5).forEach((member: any) => {
    console.log(`- ${member.firstName} ${member.lastName} (${member.email}) - ${member.membershipStatus}`);
  });
}

checkMembers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
  });
