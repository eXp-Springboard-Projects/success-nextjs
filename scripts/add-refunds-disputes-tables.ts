import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating refunds table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "refunds" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "paymentId" TEXT NOT NULL,
        "originalAmount" DECIMAL(10,2) NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "reason" TEXT NOT NULL,
        "notes" TEXT,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "processedBy" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "refunds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log('Creating indexes for refunds...');
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "refunds_userId_idx" ON "refunds"("userId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "refunds_status_idx" ON "refunds"("status");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "refunds_createdAt_idx" ON "refunds"("createdAt");`);

    console.log('Creating disputes table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "disputes" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "chargeId" TEXT NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "reason" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'needs_response',
        "dueDate" TIMESTAMP(3),
        "notes" TEXT,
        "stripeDisputeId" TEXT,
        "createdBy" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "disputes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log('Creating indexes for disputes...');
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "disputes_userId_idx" ON "disputes"("userId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "disputes_status_idx" ON "disputes"("status");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "disputes_createdAt_idx" ON "disputes"("createdAt");`);

    console.log('Creating dispute_status_history table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "dispute_status_history" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "disputeId" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "changedBy" TEXT NOT NULL,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Creating indexes for dispute_status_history...');
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "dispute_status_history_disputeId_idx" ON "dispute_status_history"("disputeId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "dispute_status_history_createdAt_idx" ON "dispute_status_history"("createdAt");`);

    console.log('Tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
