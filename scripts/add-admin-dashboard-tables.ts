import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding admin dashboard tables...');

  // Add tables via raw SQL since Prisma schema will be updated separately

  // Staff announcements table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS staff_announcements (
      id TEXT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_by_email VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      priority VARCHAR(20) DEFAULT 'NORMAL',
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_staff_announcements_is_active ON staff_announcements(is_active);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_staff_announcements_created_at ON staff_announcements(created_at);
  `;

  // Kanban boards table (already exists as projects table, but we'll extend it)

  // Kanban cards table - using existing projects table structure
  console.log('Using existing projects table for Kanban functionality');

  // Activity feed table (already exists as audit_logs, but we'll create a view-specific one)
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS staff_activity_feed (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_email VARCHAR(255) NOT NULL,
      user_name VARCHAR(255),
      department VARCHAR(50),
      action VARCHAR(255) NOT NULL,
      entity_type VARCHAR(100),
      entity_id TEXT,
      entity_name VARCHAR(255),
      description TEXT,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_staff_activity_feed_user_id ON staff_activity_feed(user_id);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_staff_activity_feed_department ON staff_activity_feed(department);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_staff_activity_feed_created_at ON staff_activity_feed(created_at);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_staff_activity_feed_action ON staff_activity_feed(action);
  `;

  // Add department field to users table if it doesn't exist
  try {
    await prisma.$executeRaw`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_department VARCHAR(50);
    `;
    console.log('Added primary_department column to users table');
  } catch (error) {
    console.log('primary_department column might already exist');
  }

  // Create department access log
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS department_access_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      department VARCHAR(50) NOT NULL,
      page_path VARCHAR(500) NOT NULL,
      action VARCHAR(100) NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_department_access_log_user_id ON department_access_log(user_id);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_department_access_log_department ON department_access_log(department);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_department_access_log_created_at ON department_access_log(created_at);
  `;

  // Seed initial data
  console.log('Seeding default permissions and departments...');

  // Insert default announcements (none for now, Super Admin will create)

  console.log('✅ Admin dashboard tables created successfully!');
}

main()
  .catch((e) => {
    console.error('Error adding admin dashboard tables:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
