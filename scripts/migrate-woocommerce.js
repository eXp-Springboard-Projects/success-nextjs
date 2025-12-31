#!/usr/bin/env node

/**
 * WooCommerce to Next.js Migration Script
 *
 * This script migrates products from WooCommerce REST API to PostgreSQL database.
 *
 * Usage: node scripts/migrate-woocommerce.js
 *
 * Required Environment Variables:
 * - WC_CONSUMER_KEY: WooCommerce API consumer key
 * - WC_CONSUMER_SECRET: WooCommerce API consumer secret
 */

const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

// Configuration
const WC_API_URL = 'https://www.success.com/wp-json/wc/v3';
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY || '';
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || '';
const LOG_FILE = path.join(__dirname, 'woocommerce-migration-log.csv');
const STATE_FILE = path.join(__dirname, 'woocommerce-state.json');
const PER_PAGE = 100;

// Migration state
let state = {
  products: { completed: false, count: 0, lastPage: 0 },
  errors: []
};

// CSV log
const csvRows = ['type,wc_id,slug,name,price,status'];

/**
 * Fetch data from WooCommerce REST API
 */
async function fetchFromWooCommerce(endpoint, page = 1, perPage = PER_PAGE) {
  if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    console.error('❌ Missing WooCommerce API credentials!');
    console.error('Set WC_CONSUMER_KEY and WC_CONSUMER_SECRET environment variables');
    process.exit(1);
  }

  const url = `${WC_API_URL}/${endpoint}?per_page=${perPage}&page=${page}&consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
  console.log(`Fetching: ${endpoint} (page ${page})`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
    const total = parseInt(response.headers.get('X-WP-Total') || '0');

    return { data, totalPages, total };
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.message);
    state.errors.push({ endpoint, page, error: error.message });
    return { data: [], totalPages: 0, total: 0 };
  }
}

/**
 * Save state to disk
 */
async function saveState() {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Load state from disk
 */
async function loadState() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf-8');
    state = { ...state, ...JSON.parse(data) };
    console.log('Resumed from previous state');
  } catch (error) {
    console.log('Starting fresh migration');
  }
}

/**
 * Migrate WooCommerce products
 */
async function migrateProducts() {
  if (state.products.completed) {
    console.log('✓ Products already migrated, skipping...');
    return;
  }

  console.log('\n📥 Migrating WooCommerce Products...');

  let page = state.products.lastPage || 1;
  let hasMore = true;

  while (hasMore) {
    const { data: products, totalPages } = await fetchFromWooCommerce('products', page);

    for (const wcProduct of products) {
      try {
        // Check if product exists
        const existing = await prisma.products.findUnique({
          where: { slug: wcProduct.slug }
        });

        if (existing) {
          console.log(`  ⊘ Product already exists: ${wcProduct.name}`);
          continue;
        }

        // Extract price
        const price = parseFloat(wcProduct.price) || 0;
        const salePrice = wcProduct.sale_price ? parseFloat(wcProduct.sale_price) : null;

        // Extract images
        const imageUrl = wcProduct.images?.[0]?.src || null;
        const galleryImages = wcProduct.images?.slice(1).map(img => img.src) || [];

        // Status mapping
        let status = 'DRAFT';
        if (wcProduct.status === 'publish') {
          if (wcProduct.stock_status === 'instock') {
            status = 'PUBLISHED';
          } else if (wcProduct.stock_status === 'outofstock') {
            status = 'OUT_OF_STOCK';
          }
        }

        // Create product
        await prisma.products.create({
          data: {
            id: randomUUID(),
            name: wcProduct.name,
            slug: wcProduct.slug,
            description: wcProduct.description || null,
            shortDescription: wcProduct.short_description || null,
            price: price,
            salePrice: salePrice,
            sku: wcProduct.sku || null,
            stockQuantity: wcProduct.stock_quantity || null,
            imageUrl: imageUrl,
            galleryImages: galleryImages,
            status: status,
            featured: wcProduct.featured || false,
            tags: wcProduct.tags?.map(tag => tag.name) || [],
            weight: wcProduct.weight ? parseFloat(wcProduct.weight) : null,
            dimensions: wcProduct.dimensions ?
              `${wcProduct.dimensions.length}x${wcProduct.dimensions.width}x${wcProduct.dimensions.height}` :
              null,
            downloadable: wcProduct.downloadable || false,
            downloadUrl: wcProduct.downloads?.[0]?.file || null,
            updatedAt: new Date(),
          }
        });

        // Log product
        csvRows.push(`product,${wcProduct.id},${wcProduct.slug},${wcProduct.name},${price},${status}`);

        state.products.count++;
        console.log(`  ✓ Imported product: ${wcProduct.name} ($${price})`);
      } catch (error) {
        console.error(`  ✗ Failed to import product ${wcProduct.id}:`, error.message);
        state.errors.push({
          type: 'product',
          id: wcProduct.id,
          name: wcProduct.name,
          error: error.message
        });
      }
    }

    state.products.lastPage = page;
    hasMore = page < totalPages;
    page++;
    await saveState();
  }

  state.products.completed = true;
  await saveState();
  console.log(`✓ Products migrated: ${state.products.count}`);
}

/**
 * Save CSV log
 */
async function saveCsvLog() {
  await fs.writeFile(LOG_FILE, csvRows.join('\n'));
  console.log(`\n✓ Product log saved to: ${LOG_FILE}`);
}

/**
 * Main migration function
 */
async function main() {
  console.log('🛍️  Starting WooCommerce to Next.js Migration\n');
  console.log(`Source: ${WC_API_URL}\n`);

  await loadState();

  try {
    await migrateProducts();
    await saveCsvLog();

    console.log('\n✅ Migration Complete!');
    console.log(`\nSummary:`);
    console.log(`  Products: ${state.products.count}`);
    console.log(`  Errors: ${state.errors.length}`);

    if (state.errors.length > 0) {
      console.log(`\n⚠️  ${state.errors.length} errors occurred during migration`);
      console.log(`Check woocommerce-state.json for details`);
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await saveState();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
main();
