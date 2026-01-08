import pkg from 'pg';
const { Client } = pkg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function addSocialTeamRole() {
  await client.connect();

  try {
    // Add SOCIAL_TEAM to the Role enum
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'Role' AND e.enumlabel = 'SOCIAL_TEAM'
        ) THEN
          ALTER TYPE "Role" ADD VALUE 'SOCIAL_TEAM';
        END IF;
      END $$;
    `);

    console.log('✓ SOCIAL_TEAM role added to database enum');
  } catch (error) {
    console.error('Error adding SOCIAL_TEAM role:', error);
  } finally {
    await client.end();
  }
}

addSocialTeamRole();
