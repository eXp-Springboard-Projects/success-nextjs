import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

interface ProductData {
  id?: string;
  wordpress_id: number;
  name: string;
  slug: string;
  price: number;
  sku: string;
  description?: string;
  short_description?: string;
  stripe_price_id?: string;
  is_subscription: boolean;
  billing_period?: 'monthly' | 'yearly';
  image_url?: string;
  category?: string;
  in_stock: boolean;
}

async function main() {
  const jsonPath = process.argv[2] || './data/products.json';

  console.log(`Importing products from: ${jsonPath}\n`);

  // Read JSON file
  const jsonContent = readFileSync(jsonPath, 'utf-8');
  const products = JSON.parse(jsonContent) as ProductData[];

  console.log(`Found ${products.length} products to import\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const prod of products) {
    try {
      // Check if product already exists by SKU or slug
      const existing = await prisma.products.findFirst({
        where: {
          OR: [
            { sku: prod.sku },
            { slug: prod.slug },
          ],
        },
      });

      if (existing) {
        console.log(`⚠️  Skipping existing product: ${prod.name} (${prod.sku})`);
        skipped++;
        continue;
      }

      // Create product
      const product = await prisma.products.create({
        data: {
          id: nanoid(),
          name: prod.name,
          slug: prod.slug,
          description: prod.description || prod.short_description || '',
          price: prod.price,
          sku: prod.sku,
          stock: prod.in_stock ? 999 : 0, // Set high stock for digital products
          category: prod.category || 'General',
          imageUrl: prod.image_url || null,
          stripePriceId: prod.stripe_price_id || null,
          isSubscription: prod.is_subscription,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`✓ Imported: ${product.name} - $${product.price} (${product.sku})`);
      imported++;

    } catch (error) {
      console.error(`✗ Error importing ${prod.name}:`, error);
      errors++;
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`✓ Imported: ${imported}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`✗ Errors: ${errors}`);
  console.log(`Total: ${products.length}`);

  // Show product summary
  const productSummary = await prisma.products.groupBy({
    by: ['isSubscription'],
    _count: true,
  });

  console.log('\n=== Product Summary ===');
  productSummary.forEach(group => {
    console.log(`${group.isSubscription ? 'Subscriptions' : 'One-time products'}: ${group._count}`);
  });
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
