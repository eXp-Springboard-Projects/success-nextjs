import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addDevOpsTables() {
  try {
    console.log('🚀 Adding DevOps tables...\n');

    // Create DeploymentStatus enum
    console.log('Step 1: Creating DeploymentStatus enum...');
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "DeploymentStatus" AS ENUM ('IN_PROGRESS', 'SUCCESS', 'FAILED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('✅ Enum created\n');

    // Create feature_flags table
    console.log('Step 2: Creating feature_flags table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        name TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT false,
        "affectedUsers" INTEGER NOT NULL DEFAULT 0,
        "lastModifiedBy" TEXT,
        "lastModifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "feature_flags_enabled_idx" ON feature_flags(enabled)');
    console.log('✅ feature_flags table created\n');

    // Create deployments table
    console.log('Step 3: Creating deployments table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS deployments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        version TEXT NOT NULL,
        branch TEXT NOT NULL,
        commit TEXT NOT NULL,
        "deployedBy" TEXT NOT NULL,
        "deployedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status "DeploymentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
        environment TEXT NOT NULL DEFAULT 'production',
        "buildTime" INTEGER,
        "errorMessage" TEXT
      )
    `;
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "deployments_deployedAt_idx" ON deployments("deployedAt")');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "deployments_status_idx" ON deployments(status)');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "deployments_environment_idx" ON deployments(environment)');
    console.log('✅ deployments table created\n');

    // Create system_settings table
    console.log('Step 4: Creating system_settings table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS system_settings (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedBy" TEXT
      )
    `;
    console.log('✅ system_settings table created\n');

    // Seed initial feature flags
    console.log('Step 5: Seeding initial feature flags...');
    await prisma.$executeRaw`
      INSERT INTO feature_flags (name, description, enabled, "affectedUsers")
      VALUES
        ('new_dashboard_ui', 'Enable the redesigned admin dashboard', true, 47),
        ('ai_content_suggestions', 'Show AI-powered content recommendations', false, 1247),
        ('advanced_analytics', 'Enable premium analytics features', true, 523),
        ('beta_features', 'Enable experimental beta features', false, 89)
      ON CONFLICT (name) DO NOTHING
    `;
    console.log('✅ Feature flags seeded\n');

    // Seed maintenance mode setting
    console.log('Step 6: Seeding system settings...');
    await prisma.$executeRaw`
      INSERT INTO system_settings (key, value)
      VALUES ('maintenance_mode', 'false')
      ON CONFLICT (key) DO NOTHING
    `;
    await prisma.$executeRaw`
      INSERT INTO system_settings (key, value)
      VALUES ('cache_last_cleared', ${new Date().toISOString()})
      ON CONFLICT (key) DO NOTHING
    `;
    console.log('✅ System settings seeded\n');

    console.log('🎉 DevOps tables added successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addDevOpsTables();
