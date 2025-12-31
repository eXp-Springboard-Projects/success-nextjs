/**
 * Migration: Add Order Fulfillment Fields
 * Adds fields needed for order fulfillment tracking and WooCommerce integration
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Adding order fulfillment fields...');

  try {
    // Add fulfillment fields to orders table
    await prisma.$executeRaw`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS "orderSource" TEXT DEFAULT 'InHouse',
      ADD COLUMN IF NOT EXISTS "woocommerceOrderId" INTEGER,
      ADD COLUMN IF NOT EXISTS "fulfillmentStatus" TEXT DEFAULT 'UNFULFILLED',
      ADD COLUMN IF NOT EXISTS "fulfilledAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "fulfilledBy" TEXT,
      ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT,
      ADD COLUMN IF NOT EXISTS "trackingCarrier" TEXT,
      ADD COLUMN IF NOT EXISTS "trackingUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "packingSlipPrinted" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "internalNotes" TEXT,
      ADD COLUMN IF NOT EXISTS "customerNotes" TEXT
    `;

    console.log('✅ Added fulfillment fields to orders table');

    // Create index on woocommerceOrderId for fast lookups
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "orders_woocommerceOrderId_idx" ON orders("woocommerceOrderId")
    `;

    console.log('✅ Created index on woocommerceOrderId');

    // Create index on fulfillmentStatus for filtering
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "orders_fulfillmentStatus_idx" ON orders("fulfillmentStatus")
    `;

    console.log('✅ Created index on fulfillmentStatus');

    // Create index on orderSource for filtering
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "orders_orderSource_idx" ON orders("orderSource")
    `;

    console.log('✅ Created index on orderSource');

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNew fields added:');
    console.log('- orderSource: InHouse | WooCommerce | Stripe');
    console.log('- woocommerceOrderId: for syncing with WooCommerce');
    console.log('- fulfillmentStatus: UNFULFILLED | FULFILLED | PARTIALLY_FULFILLED | SHIPPED');
    console.log('- fulfilledAt: timestamp when order was fulfilled');
    console.log('- fulfilledBy: admin user who fulfilled the order');
    console.log('- trackingNumber: shipping tracking number');
    console.log('- trackingCarrier: USPS, UPS, FedEx, DHL, etc.');
    console.log('- trackingUrl: full tracking URL');
    console.log('- packingSlipPrinted: whether packing slip was printed');
    console.log('- internalNotes: CS notes about fulfillment');
    console.log('- customerNotes: notes visible to customer');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
