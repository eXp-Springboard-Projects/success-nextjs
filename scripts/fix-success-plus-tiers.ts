
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

function parseCSV(csvContent: string): string[] {
  const lines = csvContent.split('\n');
  const emails: string[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Extract email from 4th column (index 3)
    // CSV format: "Record ID","First Name","Last Name","Email",...
    const match = line.match(/"[^"]*","[^"]*","[^"]*","([^"]+)"/);
    if (match && match[1]) {
      emails.push(match[1].toLowerCase().trim());
    }
  }

  return emails;
}

async function main() {
  console.log('🔧 FIXING SUCCESS+ MEMBERSHIP TIERS\n');

  // Step 1: Read SUCCESS+ member emails from CSV files
  console.log('📂 Reading SUCCESS+ member lists from CSV files...');

  const insidersCSV = readFileSync('data/insiders.csv', 'utf-8');
  const collectiveCSV = readFileSync('data/collective.csv', 'utf-8');

  const insidersEmails = parseCSV(insidersCSV);
  const collectiveEmails = parseCSV(collectiveCSV);

  // Extract emails and normalize (lowercase, trim)
  const successPlusEmails = new Set<string>();

  for (const email of insidersEmails) {
    if (email && email.includes('@')) {
      successPlusEmails.add(email);
    }
  }

  for (const email of collectiveEmails) {
    if (email && email.includes('@')) {
      successPlusEmails.add(email);
    }
  }

  console.log(`✓ Found ${successPlusEmails.size} unique SUCCESS+ member emails\n`);

  // Step 2: Reset ALL members to 'Free' tier
  console.log('🔄 Resetting ALL members to "Free" tier...');

  const resetResult = await prisma.members.updateMany({
    data: {
      membershipTier: 'Free',
      updatedAt: new Date()
    }
  });

  console.log(`✓ Reset ${resetResult.count} members to "Free" tier\n`);

  // Step 3: Update SUCCESS+ members to 'SUCCESSPlus' tier
  console.log('⭐ Updating SUCCESS+ members...');

  let successCount = 0;
  let notFoundCount = 0;

  for (const email of successPlusEmails) {
    try {
      const result = await prisma.members.updateMany({
        where: {
          email: email
        },
        data: {
          membershipTier: 'SUCCESSPlus',
          membershipStatus: 'Active',
          updatedAt: new Date()
        }
      });

      if (result.count > 0) {
        successCount++;
        if (successCount % 20 === 0) {
          console.log(`  Progress: ${successCount}/${successPlusEmails.size}...`);
        }
      } else {
        notFoundCount++;
        console.log(`  ⚠️  Email not found in members table: ${email}`);
      }
    } catch (error: any) {
      console.error(`  ❌ Error updating ${email}:`, error.message);
    }
  }

  console.log(`\n✨ SUCCESS+ tier update complete!`);
  console.log(`   - Updated to SUCCESS+: ${successCount}`);
  console.log(`   - Emails not found: ${notFoundCount}`);
  console.log(`   - Total in CSV files: ${successPlusEmails.size}\n`);

  // Step 4: Verify final counts
  console.log('🔍 Verifying final counts...');

  const finalSuccessPlus = await prisma.members.count({
    where: { membershipTier: 'SUCCESSPlus' }
  });

  const finalFree = await prisma.members.count({
    where: { membershipTier: 'Free' }
  });

  const total = await prisma.members.count();

  console.log(`\n📊 FINAL COUNTS:`);
  console.log(`   - SUCCESS+ members: ${finalSuccessPlus}`);
  console.log(`   - Free members: ${finalFree}`);
  console.log(`   - Total members: ${total}`);
  console.log(`\n✅ Fix complete!`);
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
