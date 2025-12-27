import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient('https://aczlassjkbtwenzsohwm.supabase.co', 'sb_secret_bx9obYWu-6qwAoNavXVGCg_m3vemyQK');

async function addMissing() {
  const hashedPassword = await bcrypt.hash('Success2025!', 10);
  const now = new Date().toISOString();

  const missing = [
    { name: 'Shawana Crayton', email: 'shawana.crayton@success.com' },
    { name: 'Elly Kang', email: 'elly.kang@success.com' },
    { name: 'Jamie Lyons', email: 'jamie.lyons@success.com' },
    { name: 'Kristen McMahon', email: 'kristen.mcmahon@success.com' },
  ];

  for (const staff of missing) {
    const { error } = await supabase.from('users').insert({
      id: uuidv4(),
      email: staff.email,
      name: staff.name,
      password: hashedPassword,
      role: 'EDITOR',
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    if (error) console.log('❌ Error:', staff.name, error.message);
    else console.log('✅ Created:', staff.name);
  }
}

addMissing();
