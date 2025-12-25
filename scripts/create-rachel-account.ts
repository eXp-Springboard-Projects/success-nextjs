import { supabaseAdmin } from '../lib/supabase';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

async function createRachelAccount() {
  const supabase = supabaseAdmin();
  const email = 'rachel.nead@exprealty.net';
  const password = 'TempPassword123!'; // CHANGE THIS AFTER LOGIN

  console.log('Creating account for:', email);

  // Check if already exists
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existing) {
    console.log('Account already exists!');
    console.log('User ID:', existing.id);
    console.log('Email:', existing.email);
    console.log('Role:', existing.role);
    console.log('Email Verified:', existing.email_verified);
    return;
  }

  // Create account
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = nanoid();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      first_name: 'Rachel',
      last_name: 'Nead',
      role: 'SUPER_ADMIN',
      primary_department: 'SUPER_ADMIN',
      email_verified: true,
      created_at: now,
      updated_at: now
    });

  if (error) {
    console.error('ERROR:', error);
    throw error;
  }

  console.log('✅ Account created successfully!');
  console.log('Email:', email);
  console.log('Temporary Password:', password);
  console.log('Role: SUPER_ADMIN');
  console.log('\n⚠️  IMPORTANT: Change your password immediately after logging in!');
}

createRachelAccount()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
