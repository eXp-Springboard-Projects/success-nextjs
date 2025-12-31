import { supabaseAdmin } from '../lib/supabase';

async function findUser() {
  const supabase = supabaseAdmin();

  // Search for Tyler
  const { data: tyler } = await supabase
    .from('users')
    .select('email, name, role, createdAt')
    .ilike('name', '%tyler%');

  if (tyler && tyler.length > 0) {
    console.log('Found Tyler:');
    tyler.forEach(u => console.log(`  ${u.email} - ${u.name} (${u.role})`));
    return;
  }

  // Search for Clayton
  const { data: clayton } = await supabase
    .from('users')
    .select('email, name, role, createdAt')
    .ilike('name', '%clayton%');

  if (clayton && clayton.length > 0) {
    console.log('Found Clayton:');
    clayton.forEach(u => console.log(`  ${u.email} - ${u.name} (${u.role})`));
    return;
  }

  // Show all success.com users
  console.log('Tyler Clayton not found. All @success.com users:');
  const { data: all } = await supabase
    .from('users')
    .select('email, name, role')
    .ilike('email', '%success.com%');

  if (all) {
    all.forEach(u => console.log(`  ${u.email} - ${u.name} (${u.role})`));
  }
}

findUser();
