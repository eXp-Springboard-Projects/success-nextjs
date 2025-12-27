import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = 'sb_secret_bx9obYWu-6qwAoNavXVGCg_m3vemyQK';

const supabase = createClient(supabaseUrl, supabaseKey);

// Team members with generated @success.com emails
// Valid roles: SUPER_ADMIN, ADMIN, EDITOR, USER
const staffMembers = [
  { name: 'Glenn Sanford', email: 'glenn.sanford@success.com', title: 'Managing Director & Publisher', role: 'ADMIN' },
  { name: 'Kerrie Lee Brown', email: 'kerrie.brown@success.com', title: 'Chief Content Officer & Editor-in-Chief', role: 'ADMIN' },
  { name: 'Courtland Warren', email: 'courtland.warren@success.com', title: 'Founding Faculty & Program Lead, SUCCESS Coaching', role: 'EDITOR' },
  { name: 'Rachel Nead', email: 'rachel.nead@success.com', title: 'Vice President of Innovations', role: 'SUPER_ADMIN' },
  { name: 'Lauren Kerrigan', email: 'lauren.kerrigan@success.com', title: 'Creative Director', role: 'EDITOR' },
  { name: 'Talitha Brumwell', email: 'talitha.brumwell@success.com', title: 'Innovation Enablement Lead', role: 'EDITOR' },
  { name: 'Tyler Clayton', email: 'tyler.clayton@success.com', title: 'Platform Steward - Digital Content Ecosystem', role: 'EDITOR' },
  { name: 'Shawana Crayton', email: 'shawana.crayton@success.com', title: 'Business Admin & Customer Support Specialist', role: 'USER' },
  { name: 'Carlos Gutierrez', email: 'carlos.gutierrez@success.com', title: 'Video Production Specialist', role: 'EDITOR' },
  { name: 'Harmony Heslop', email: 'harmony.heslop@success.com', title: 'Departmental Support Specialist', role: 'EDITOR' },
  { name: 'Emily Holombek', email: 'emily.holombek@success.com', title: 'E-Learning & Enrichment Content Specialist', role: 'EDITOR' },
  { name: 'Elly Kang', email: 'elly.kang@success.com', title: 'Marketing Operations Assistant', role: 'USER' },
  { name: 'Sarah Kuta', email: 'sarah.kuta@success.com', title: 'Copy Editor/Fact-Checker', role: 'EDITOR' },
  { name: 'Virginia Le', email: 'virginia.le@success.com', title: 'Senior Production Manager', role: 'EDITOR' },
  { name: 'Denise Long', email: 'denise.long@success.com', title: 'QC/Fact-Checker', role: 'EDITOR' },
  { name: 'Jamie Lyons', email: 'jamie.lyons@success.com', title: 'Executive & Team Assistant', role: 'USER' },
  { name: 'Rena Machani', email: 'rena.machani@success.com', title: 'Editorial Assistant', role: 'EDITOR' },
  { name: 'Kristen McMahon', email: 'kristen.mcmahon@success.com', title: 'Customer Experience Specialist', role: 'USER' },
  { name: 'Belle Mitchum', email: 'belle.mitchum@success.com', title: 'Marketing Editor', role: 'EDITOR' },
  { name: 'Hugh Murphy', email: 'hugh.murphy@success.com', title: 'Product Development & Marketing Manager', role: 'EDITOR' },
  { name: "Emily O'Brien", email: 'emily.obrien@success.com', title: 'Print Managing Editor', role: 'EDITOR' },
  { name: 'Destinie Orndoff', email: 'destinie.orndoff@success.com', title: 'Marketing Copywriter', role: 'EDITOR' },
  { name: 'Staci Parks', email: 'staci.parks@success.com', title: 'Copy Editor/Fact-Checker', role: 'EDITOR' },
  { name: 'Jazzlyn Torres', email: 'jazzlyn.torres@success.com', title: 'Communications Coordinator', role: 'EDITOR' },
  { name: 'Emily Tvelia', email: 'emily.tvelia@success.com', title: 'Marketing Operations Specialist', role: 'EDITOR' },
];

async function createStaffAccounts() {
  console.log('\n🚀 Creating SUCCESS.com Staff Accounts\n');
  console.log('═'.repeat(80));

  // Default password: Success2025! (they should reset on first login)
  const defaultPassword = 'Success2025!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const staff of staffMembers) {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('email')
      .eq('email', staff.email)
      .single();

    if (existing) {
      console.log(`⏭️  SKIP: ${staff.name} (${staff.email}) - already exists`);
      skipped++;
      continue;
    }

    // Create user account
    const now = new Date().toISOString();
    const { data, error} = await supabase
      .from('users')
      .insert({
        id: uuidv4(),
        email: staff.email,
        name: staff.name,
        password: hashedPassword,
        role: staff.role,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) {
      console.log(`❌ ERROR: ${staff.name} - ${error.message}`);
      errors++;
    } else {
      console.log(`✅ CREATED: ${staff.name} - ${staff.email} (${staff.role})`);
      created++;
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 SUMMARY:');
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total: ${staffMembers.length}`);
  console.log(`\n🔑 Default Password: ${defaultPassword}`);
  console.log('   (All staff should reset their password on first login)\n');

  // Display full staff list
  console.log('\n' + '═'.repeat(80));
  console.log('COMPLETE STAFF DIRECTORY');
  console.log('═'.repeat(80));

  staffMembers.forEach((s, i) => {
    console.log(`\n${i + 1}. ${s.name}`);
    console.log(`   Email: ${s.email}`);
    console.log(`   Title: ${s.title}`);
    console.log(`   Role: ${s.role}`);
  });

  console.log('\n' + '═'.repeat(80));
}

createStaffAccounts().catch(console.error);
