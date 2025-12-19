/**
 * Create SUCCESS Staff Accounts
 *
 * Creates accounts for all SUCCESS.com staff members
 *
 * Usage:
 *   DATABASE_URL="..." npx tsx scripts/create-success-staff.ts
 */

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

interface StaffMember {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

const SUCCESS_STAFF: StaffMember[] = [
  { firstName: 'Admin', lastName: 'Success', email: 'admin@success.com', role: 'SUPER_ADMIN' },
  { firstName: 'Belle', lastName: 'Mitchum', email: 'belle.mitchum@success.com', role: 'EDITOR' },
  { firstName: 'Carlos', lastName: 'Gutierrez', email: 'carlos.gutierrez@success.com', role: 'EDITOR' },
  { firstName: 'Courtland', lastName: 'Warren', email: 'courtland@success.com', role: 'EDITOR' },
  { firstName: 'Demetrius', lastName: 'Thomas', email: 'demetrius.thomas@success.com', role: 'EDITOR' },
  { firstName: 'Denise', lastName: 'Long', email: 'denise.long@success.com', role: 'EDITOR' },
  { firstName: 'Destinie', lastName: 'Orndoff', email: 'destinie.orndoff@success.com', role: 'EDITOR' },
  { firstName: 'Elly', lastName: 'Kang', email: 'elly.kang@success.com', role: 'EDITOR' },
  { firstName: 'Emily', lastName: 'O\'Brien', email: 'emily.obrien@success.com', role: 'EDITOR' },
  { firstName: 'Emily', lastName: 'Holombek', email: 'emily.holombek@success.com', role: 'EDITOR' },
  { firstName: 'Emily', lastName: 'Tvelia', email: 'emily.tvelia@success.com', role: 'EDITOR' },
  { firstName: 'eXp', lastName: 'Finance', email: 'finance@success.com', role: 'ADMIN' },
  { firstName: 'eXp', lastName: 'Admin', email: 'expadmin@success.com', role: 'ADMIN' },
  { firstName: 'Glenn', lastName: 'Sanford', email: 'glenn@success.com', role: 'SUPER_ADMIN' },
  { firstName: 'Harmony', lastName: 'Heslop', email: 'harmony.heslop@success.com', role: 'EDITOR' },
  { firstName: 'Hugh', lastName: 'Murphy', email: 'hmurphy@success.com', role: 'EDITOR' },
  { firstName: 'Jamie', lastName: 'Lyons', email: 'jamie.lyons@success.com', role: 'EDITOR' },
  { firstName: 'Jazzlyn', lastName: 'Torres', email: 'jazzlyn.torres@success.com', role: 'EDITOR' },
  { firstName: 'Keith', lastName: 'Tollefson', email: 'keith.tollefson@success.com', role: 'EDITOR' },
  { firstName: 'Kerrie Lee', lastName: 'Brown', email: 'kerrie.brown@success.com', role: 'EDITOR' },
  { firstName: 'Kristen', lastName: 'McMahon', email: 'kristen.mcmahon@success.com', role: 'EDITOR' },
  { firstName: 'Kyle', lastName: 'Kittleson', email: 'kyle.kittleson@success.com', role: 'EDITOR' },
  { firstName: 'Lauren', lastName: 'Kerrigan', email: 'lauren.kerrigan@success.com', role: 'EDITOR' },
  { firstName: 'Rachel', lastName: 'Nead', email: 'rachel.nead@success.com', role: 'SUPER_ADMIN' },
  { firstName: 'Rena', lastName: 'Machani', email: 'rena.machani@success.com', role: 'EDITOR' },
  { firstName: 'Sarah', lastName: 'Kuta', email: 'sarah.kuta@success.com', role: 'EDITOR' },
  { firstName: 'Shawana', lastName: 'Crayton', email: 'shawana.crayton@success.com', role: 'EDITOR' },
  { firstName: 'Staci', lastName: 'Parks', email: 'staci.parks@success.com', role: 'EDITOR' },
  { firstName: 'SUCCESS', lastName: 'Enterprises', email: 'marketing.admin@success.com', role: 'ADMIN' },
  { firstName: 'Talitha', lastName: 'Prospert', email: 'talitha.prospert@success.com', role: 'ADMIN' },
  { firstName: 'Tyler', lastName: 'Clayton', email: 'tyler.clayton@success.com', role: 'EDITOR' },
  { firstName: 'Virginia', lastName: 'Le', email: 'virginia.le@success.com', role: 'EDITOR' },
];

async function createSuccessStaff() {
  console.log('\n👥 Creating SUCCESS Staff Accounts');
  console.log('=====================================\n');

  // Default password: Success2025! (they should change on first login)
  const defaultPassword = 'Success2025!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  let created = 0;
  let existed = 0;
  let updated = 0;

  for (const staff of SUCCESS_STAFF) {
    try {
      // Check if user exists
      const existing = await prisma.users.findUnique({
        where: { email: staff.email.toLowerCase() },
      });

      if (existing) {
        // Update existing user to ensure they have the correct role
        await prisma.users.update({
          where: { email: staff.email.toLowerCase() },
          data: {
            name: `${staff.firstName} ${staff.lastName}`,
            role: staff.role,
            emailVerified: true,
            updatedAt: new Date(),
          },
        });
        console.log(`✅ Updated: ${staff.firstName} ${staff.lastName} (${staff.email}) - ${staff.role}`);
        updated++;
      } else {
        // Create new user
        await prisma.users.create({
          data: {
            id: randomUUID(),
            email: staff.email.toLowerCase(),
            password: hashedPassword,
            name: `${staff.firstName} ${staff.lastName}`,
            role: staff.role,
            emailVerified: true,
          },
        });

        console.log(`✅ Created: ${staff.firstName} ${staff.lastName} (${staff.email}) - ${staff.role}`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${staff.email}:`, error);
    }
  }

  console.log('\n=====================================');
  console.log(`📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Total: ${SUCCESS_STAFF.length}`);
  console.log('\n🔑 Default Credentials:');
  console.log(`   Password: ${defaultPassword}`);
  console.log(`   ⚠️  Users should change their password on first login`);
  console.log('\n📧 Access:');
  console.log(`   Login URL: https://success.com/admin/login`);
  console.log(`   Staff signup: https://success.com/signup/staff`);
  console.log('\n=====================================\n');
}

async function main() {
  try {
    await createSuccessStaff();
    console.log('✨ Done!\n');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
