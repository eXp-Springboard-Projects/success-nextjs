import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking user table structure...');

  try {
    // Check what values exist in the role column
    const roles = await prisma.$queryRaw`
      SELECT DISTINCT role FROM users
    `;

    console.log('Existing roles in users table:', roles);

    // Check the column type
    const columnInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'role'
    `;

    console.log('Role column info:', columnInfo);

    // Check if enum type exists
    const enumTypes = await prisma.$queryRaw`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname LIKE '%role%'
      ORDER BY t.typname, e.enumsortorder;
    `;

    console.log('Enum types with "role" in name:', enumTypes);
  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
