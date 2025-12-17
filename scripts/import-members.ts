import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface MemberRow {
  email: string;
  first_name: string;
  last_name: string;
  membership_tier: string; // 'TRIAL' | 'BASIC' | 'PREMIUM'
  subscription_status: string; // 'active' | 'pending-cancel'
  subscription_start: string;
  subscription_end: string;
  payment_method: string;
  stripe_customer_id: string;
  last_login?: string;
}

async function main() {
  const csvPath = process.argv[2] || './data/members.csv';

  console.log(`Importing members from: ${csvPath}\n`);

  // Read CSV file
  const csvContent = readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  }) as MemberRow[];

  console.log(`Found ${records.length} members to import\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of records) {
    try {
      // Validate email
      if (!row.email || !row.email.includes('@')) {
        console.log(`⚠️  Skipping invalid email: ${row.email}`);
        skipped++;
        continue;
      }

      // Check if member already exists
      const existing = await prisma.members.findUnique({
        where: { email: row.email },
      });

      if (existing) {
        console.log(`⚠️  Skipping existing member: ${row.email}`);
        skipped++;
        continue;
      }

      // Map membership tier
      let tier: 'TRIAL' | 'BASIC' | 'PREMIUM' = 'BASIC';
      if (row.membership_tier) {
        const tierLower = row.membership_tier.toLowerCase();
        if (tierLower.includes('trial')) tier = 'TRIAL';
        else if (tierLower.includes('premium') || tierLower.includes('plus')) tier = 'PREMIUM';
      }

      // Map subscription status
      let status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' = 'ACTIVE';
      if (row.subscription_status) {
        const statusLower = row.subscription_status.toLowerCase();
        if (statusLower.includes('cancel')) status = 'CANCELLED';
        else if (statusLower.includes('past') || statusLower.includes('due')) status = 'PAST_DUE';
      }

      // Generate password hash (they'll need to reset)
      const tempPassword = await bcrypt.hash(nanoid(), 10);

      // Create member
      const member = await prisma.members.create({
        data: {
          id: nanoid(),
          email: row.email,
          firstName: row.first_name || '',
          lastName: row.last_name || '',
          passwordHash: tempPassword,
          membershipTier: tier,
          membershipStatus: status,
          stripeCustomerId: row.stripe_customer_id || null,
          subscriptionStartDate: row.subscription_start ? new Date(row.subscription_start) : new Date(),
          subscriptionEndDate: row.subscription_end ? new Date(row.subscription_end) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`✓ Imported: ${member.email} (${tier})`);
      imported++;

      // Small delay to avoid overwhelming database
      if (imported % 100 === 0) {
        console.log(`\n  Progress: ${imported}/${records.length} members imported...\n`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      console.error(`✗ Error importing ${row.email}:`, error);
      errors++;
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`✓ Imported: ${imported}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`✗ Errors: ${errors}`);
  console.log(`Total: ${records.length}`);

  // Send password reset emails
  console.log('\n⚠️  IMPORTANT: All members need to reset their passwords!');
  console.log('Run: npm run send-password-resets');
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
